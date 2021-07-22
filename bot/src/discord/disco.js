import { asyncClient } from "../db/redis.js";
import { DISCORD_SERVER_ID, COURSE_ID, CODE_PREFIX } from "../config.js";
import { EULA, WelcomeMessage } from "./messages.js";
import _ from "lodash";
import { logger } from "../util/logger.js";

const addRole = (client, user, role) =>
  client.guilds
    .fetch(DISCORD_SERVER_ID)
    .then((guild) => guild.member(user).roles.add(role));

const getRole = async (client, roleName) => {
  const guild = await client.guilds.fetch(DISCORD_SERVER_ID);
  return guild.roles.cache.find((role) => role.name === roleName);
};

const updateSubjectRoles = async (client, user, username) => {
  const roles = await getRoles(username);
  console.log("updating roles for user ", roles, username);
  roles.map((roleName) => {
    getRole(client, roleName)
      .then((role) => addRole(client, user, role))
      .catch((e) =>
        logger.log({
          level: "error",
          message: `unable to update subject roles for unimelb username ${username}`,
          error: e,
        })
      );
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

export const startSession = async (user) => {
  await asyncClient.set(`reacted+${user.id}`, user.id);
  asyncClient.expire(`reacted+${user.id}`, 100);
};

export const shouldAttemptAuth = async (client, messageReaction, user) => {
  // if the reaction was not on one of our messages, ignore
  if (!messageReaction.message.author.equals(client.user)) {
    return false;
  }

  const hasSession = await asyncClient.get(`reacted+${user.id}`);

  if (hasSession) {
    console.log(
      "user " + user.username + ", has an in progress request - ignore react."
    );
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
    return false;
  }

  return true;
};

export const matchRoles = async (client) => {
  try {
    const entries = await asyncClient.hgetall("registered");
    const server = await client.guilds.cache.get(DISCORD_SERVER_ID);
    const members = await server.members.fetch();
    await Promise.all(
      members.map(async (member) => {
        const canvasUsername = entries ? entries[member.id] : undefined;
        const discordRoles = getDiscordRoleNames(member);

        // ignore, manual job
        if (discordRoles.length != 0 && !canvasUsername) return;
        // they have a registered username but may be missing roles
        if (canvasUsername) {
          const canvasRoles = await getRoles(canvasUsername);
          const discordRoles = getDiscordRoleNames(member);
          const roleDiff = _.difference(
            canvasRoles.sort(),
            discordRoles.sort()
          );
          if (roleDiff.length != 0) {
            logger.log({
              level: "warn",
              message: `Found an un-synced user: ${canvasUsername}-${
                member.displayName
              }! added roles ${roleDiff.toString()}`,
            });
            await updateSubjectRoles(client, member, canvasUsername);
            await welcomeUser(client, member, canvasUsername);
          }
        } else {
          const haveReminded = await asyncClient.exists(
            `reminded=${member.id}`,
            member.id
          );
          if (!haveReminded && !member.user.bot) {
            asyncClient.set(`reminded=${member.id}`, member.id);
            asyncClient.expire(`reminded=${member.id}`, 60 * 60 * 24);
            await member.send(
              "Hi! You haven't yet linked a canvas account to your discord one for CIS Systems Server :(\nAccounts will expire in a week after joining. You can re-join if you are kicked and try authenticating again."
            );
            logger.log({
              level: "warn",
              message: `Discord user ${member.displayName} has been notified that their account is currently unverified. I've double checked my records and found no mention! Account will be kicked in 1 week after joining if non-authenticated.`,
            });
          }
        }
      })
    );
  } catch (e) {
    console.error(e);
  }
};

export const setupUser = async (client, discordUser, canvasUsername) => {
  await updateSubjectRoles(client, discordUser, canvasUsername);
  await setUser(discordUser, canvasUsername);
  await welcomeUser(client, discordUser, canvasUsername);
  discordUser.send(
    "I've checked your assigned roles and updated my mapping. Check back to the server."
  );
};

export const completeCodeAuth = async (client, message) => {
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

  await setupUser(client, message.author, rego.username);
};

export const getCourseChannel = async (client, course, channel) => {
  const guild = await client.guilds.fetch(DISCORD_SERVER_ID, true, true);
  return guild.channels.cache.find(
    (value) =>
      value.type == "text" &&
      value.name == channel &&
      value.parent &&
      value.parent.name == course
  );
};

export const getFirstChannelByName = async (client, channelName) => {
  const guild = await client.guilds.fetch(DISCORD_SERVER_ID);
  return guild.channels.cache.find((value) => {
    return value.name == channelName;
  });
};

export const acceptTerms = async (user) => {
  try {
    await user.send(EULA);
    const dmChan = await user.createDM();
    const message = await dmChan.awaitMessages(
      (m) => _.toUpper(m.content) === "AGREE",
      {
        max: 1,
        time: 10000,
        errors: ["time"],
      }
    );
    return true;
  } catch (e) {
    user.send(
      "You haven't agreed to the TOS (or i crashed). Please try again later."
    );
    logger.log({
      level: "warn",
      message: `Error on new user accepting TOS: ${user.username}`,
      error: e,
    });
    return false;
  }
};

const getDiscordRoleNames = (discordUser) =>
  discordUser.roles.cache
    .map((role) => role.name)
    .filter((role) => role !== "@everyone");

export const getCanvasUserInfo = async (canvasUsername) => {
  const userRoles = await getRoles(canvasUsername);
  if (userRoles.includes("teaching")) {
    const subject = userRoles
      .filter((v) => v != "staff" && !v.endsWith("staff"))
      .shift();
    if (!subject) return;
    const rawRoles = await asyncClient.hget(subject, "staff");
    const roleDb = JSON.parse(rawRoles);
    return (canvasUser = roleDb
      .filter((e) => e.user.login_id === canvasUsername)
      .shift());
  } else {
    const subject = userRoles.filter((v) => v != "student").shift();
    if (!subject) return;
    const rawRoles = await asyncClient.hget(subject, "students");
    const roleDb = JSON.parse(rawRoles);
    return (canvasUser = roleDb
      .filter((e) => e.user.login_id === canvasUsername)
      .shift());
  }
};

export const welcomeUser = async (client, discordUser, canvasUsername) => {
  try {
    canvasUser = getCanvasUserInfo(canvasUsername);
    const welcomeChannel = await getFirstChannelByName(client, "welcome");
    welcomeChannel.send(WelcomeMessage(discordUser, canvasUser));
  } catch (e) {
    logger.log({
      level: "error",
      message: `error welcoming new user ${discordUser.username}, err: ${e}`,
      error: e,
    });
  }
};
