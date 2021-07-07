import { asyncClient } from "../db/redis.js";
import { SERVER_ID, COURSE_ID, CODE_PREFIX } from "../../config.js";
import { EULA } from "./messages.js";

const addRole = (client, user, role) =>
  client.guilds
    .fetch(SERVER_ID)
    .then((guild) => guild.member(user).roles.add(role));

const getRole = async (client, roleName) => {
  const guild = await client.guilds.fetch(SERVER_ID);
  return guild.roles.cache.find((role) => role.name === roleName);
};

const updateSubjectRoles = async (client, user, username) => {
  const roles = await getRoles(username);
  roles.map((roleName) => {
    getRole(client, roleName)
      .then((role) => addRole(client, user, role))
      .catch(console.error);
  });
};

export const getRoles = async (username) =>
  await asyncClient.smembers(username);

export const startRego = (user, username) => {
  const code = genCode();
  const progObj = { code: code, username: username };
  asyncClient.set(`inprog:${user.id}`, JSON.stringify(progObj));
  asyncClient.expire(`inprog:${user.id}`, 300);
  return code;
};

const getRego = async (userId) => await asyncClient.get(`inprog:${userId}`);

const setUser = (user, username) =>
  asyncClient.hmset("registered", `${user.id}`, `${username}`);

const getUser = (user) => asyncClient.hget("registered", user.id);

const genCode = () =>
  CODE_PREFIX + Math.trunc(Math.random() * 1e16).toString(16);

export const shouldAttemptAuth = async (client, messageReaction, user) => {
  // if the reaction was not on one of our messages, ignore
  if (!messageReaction.message.author.equals(client.user)) {
    return false;
  }
  const userInfo = await getUser(user);

  // user already registered, ignore
  if (userInfo) {
    console.log(
      "user: " + user.username + ", has already registered - ignore react."
    );
    return false;
  }

  const rego = await getRego(user);

  // already have in progress request
  if (rego) {
    console.log(
      "user: " + user.username + ", is already in progress - ignore react."
    );
    user.send("Hi, you already have an in progress auth request.");
    return false;
  }

  return true;
};

export const addCodeBlockedRole = async (client, message) => {
  if (message.guild) {
    console.log("ignoring message from guild: " + message.content);
    return;
  }

  const rawRego = await getRego(message.author.id);
  const rego = JSON.parse(rawRego);

  if (!rego) {
    console.log("no registration found, ignore");
    return;
  }

  console.log(
    "recv msg, from in-progress, non-guild channel\n content: " +
      message.content +
      "\nneed: " +
      rawRego
  );

  if (!(rego.code === message.content)) {
    message.reply("invalid code, please try again").catch(console.error);
    return;
  }

  await updateSubjectRoles(client, message.author, rego.username);
  await setUser(message.author, rego.username);
  message.author.send(
    "I've checked your assigned roles and updated my the mapping. Check back to the server."
  );
};

export const getCourseChannel = async (client, course, channel) => {
  const guild = await client.guilds.fetch(SERVER_ID);
  return guild.channels.cache.find((value) => {
    return value.name == channel && value.parent && value.parent.name == course;
  });
};

export const acceptTerms = async (user) => {
  try {
    await user.send(EULA);
    const dmChan = await user.createDM();
    const message = await dmChan.awaitMessages((m) => m.content === "AGREE", {
      max: 1,
      time: 30000,
      errors: ["time"],
    });
    return true;
  } catch (e) {
    user.send("something's not quite right");
    return false;
  }
};
