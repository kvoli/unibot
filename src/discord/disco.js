import { asyncClient } from "../db/redis.js";
import { SERVER_ID, COURSE_ID, CODE_PREFIX } from "../../config.js";
import { promisify } from "util";

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
    getRole(roleName)
      .then((role) => addRole(client, user, role))
      .catch(console.error);
  });
};

const getRoles = async (username) => {
  const roles = await asyncClient.smembers(username);
  return roles.map((role) => COURSE_ID[role]);
};

export const startRego = (user, username) => {
  const code = genCode();
  const progObj = { code: code, username: username };
  asyncClient.set(`inprog:${user.id}`, JSON.stringify(progObj));
  asyncClient.expire(`inprog:${user.id}`, 300);
  return code;
};

const getRego = (user) => asyncClient.get(`inprog:${user.id}`);

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
      "user: " +
        user.username +
        ", has already registered - ignore react." +
        ret
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

export const addCodeBlockedRole = async (client, message, roleName) => {
  console.log("starting to add code blocked role for ", roleName);
  if (message.guild) {
    console.log("ignoring message from guild: " + message.content);
    return;
  }

  const rawRego = await getRego(message.author);
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

  getRole(client, roleName)
    .then((role) =>
      addRole(client, message.author, role)
        .then((_) => {
          setUser(message.author, rego.username);
          message.author.send("success, check back to the server.");
          updateSubjectRoles(client, message.author, rego.username);
        })
        .catch((err) => {
          console.error("error updating role " + roleName + ", err: " + err);
          message.author.send("error updating role :/, retry later");
        })
    )
    .catch((err) => {
      console.error("error retrieving role " + roleName + ", err: " + err);
      message.author.send("error updating role :/, retry later");
    });
};

export const getCourseChannel = async (client, course, channel) => {
  const guild = await client.guilds.fetch(SERVER_ID);
  return guild.channels.cache.find((value) => {
    return value.name == channel && value.parent && value.parent.name == course;
  });
};
