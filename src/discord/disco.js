import { publisher } from "../db/redis.js";
import { SERVER_ID, COURSE_ID } from "../../config.js";

const addRole = (client, user, role) =>
  client.guilds
    .fetch(SERVER_ID)
    .then((guild) => guild.member(user).roles.add(role));

const getRole = (client, roleName) =>
  client.guilds
    .fetch(SERVER_ID)
    .then((guild) => guild.roles.cache.find((role) => role.name === roleName))
    .catch(console.error);

const updateSubjectRoles = (client, user, username) =>
  getRoles(username).map((roleName) =>
    getRole(roleName).then((role) => addRole(client, user, role))
  );

const getRoles = (username) => {
  let roles = [];
  publisher.smembers(username, (err, reply) => {
    roles = err ? [] : reply.map((role) => COURSE_ID[role]);
  });
  return roles;
};

export const startRego = (user, username) => {
  const code = genCode();
  const progObj = { code: code, unimelb: username };
  publisher.set(`inprog:${user.id}`, JSON.stringify(progObj));
  publisher.expire(`inprog:${user.id}`, 300);
  return code;
};

const getRego = (user) => {
  const reg = undefined;
  publisher.get(`inprog:${user.id}`, (err, val) => {
    if (!err && val) reg = JSON.parse(val);
  });
  return reg;
};

const setUser = (user, username) =>
  publisher.hmset("registered", user.id, username);

const getUser = (user) => {
  const ret = undefined;
  publisher.hget("registered", user.id, (err, val) => {
    if (!err && val) ret = val;
  });
  return ret;
};

const genCode = () =>
  CODE_PREFIX + Math.trunc(Math.random() * 1e16).toString(16);

export const shouldAttemptAuth = (messageReaction, user) => {
  // if the reaction was not on one of our messages, ignore
  if (!messageReaction.message.author.equals(client.user)) {
    return false;
  }

  // user already registered, ignore
  if (getUser(user)) {
    console.log(
      "user: " + user.username + ", has already registered - ignore react."
    );
    return false;
  }

  // already have in progress request
  if (getRego(user)) {
    console.log(
      "user: " + user.username + ", is already in progress - ignore react."
    );
    user.send("Hi, you already have an in progress auth request.");
    return false;
  }

  return true;
};

export const addCodeBlockedRole = (client, message, roleName) => {
  if (message.guild) {
    console.log("ignoring message from guild: " + message.content);
    return;
  }

  const rego = getRego(message.author);
  if (!rego) return;

  console.log(
    "recv msg, from in-progress, non-guild channel" + message.content
  );

  if (rego.code != message.content) {
    message.reply("invalid code, please try again").catch(console.error);
    return;
  }

  getRole(client, roleName)
    .then((role) =>
      addRole(message.author, role)
        .then((_) => {
          setUser(message.author, rego.username);
          message.author.send("success, check back to the server.");
          updateSubjectRoles(client, rego.username);
          addRole;
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
