"use strict";

import _ from "lodash";
import { DISCORD_SERVER_ID } from "../config.js";
import { asyncClient } from "../db/redis.js";
import { logger } from "../util/logger.js";

import {
  getRole,
  getFirstChannelByName,
  getCanvasUserInfo,
  getDiscordRoleNames,
  genCode,
  getRego,
  getRoles,
} from "./disco.js";
import {
  KickWarningMessage,
  WelcomeMessage,
  TOSErrorMessage,
  KickWarningLog,
  EULA,
} from "./messages.js";

const setUser = (user, username) =>
  asyncClient.hmset("registered", `${user.id}`, `${username}`);

const addRole = (client, user, role) =>
  client.guilds
    .fetch(DISCORD_SERVER_ID)
    .then((guild) => guild.member(user).roles.add(role));

export const startSession = async (user) => {
  await asyncClient.set(`reacted+${user.id}`, user.id);
  asyncClient.expire(`reacted+${user.id}`, 100);
};

export const startRego = (user, username) => {
  let code = genCode();
  let progObj = { code: code, username: username };
  asyncClient.set(`inprog:${user.id}`, JSON.stringify(progObj));
  asyncClient.expire(`inprog:${user.id}`, 300);
  return code;
};

export const setupUser = async (client, discordUser, canvasUsername) => {
  let forceLowername = _.toLower(canvasUsername);
  await updateSubjectRoles(client, discordUser, forceLowername);
  await setUser(discordUser, forceLowername);
  await welcomeUser(client, discordUser, forceLowername);
  discordUser.send(
    "I've checked your assigned roles and updated my mapping. Check back to the server."
  );
};

export const welcomeUser = async (client, discordUser, canvasUsername) => {
  try {
    let canvasUser = await getCanvasUserInfo(canvasUsername);
    let welcomeChannel = await getFirstChannelByName(client, "welcome");
    welcomeChannel.send(WelcomeMessage(discordUser, canvasUser));
  } catch (e) {
    logger.log({
      level: "error",
      message: `error welcoming new user ${discordUser.username}`,
      error: e,
    });
  }
};

export const completeCodeAuth = async (client, message) => {
  if (message.guild) {
    console.log("ignoring message from guild: " + message.content);
    return;
  }
  let rego = JSON.parse(await getRego(message.author.id));

  if (!rego || rego.code !== message.content) {
    console.log("Code or rego incorrect");
    user.send("Error in code input");
    return;
  }

  await setupUser(client, message.author, rego.username);
};

const updateSubjectRoles = async (client, user, username) => {
  let roles = await getRoles(username);
  console.log("updating roles for user ", roles, username);
  roles.map((roleName) => {
    getRole(client, roleName)
      .then((role) => addRole(client, user, role))
      .catch((e) =>
        logger.error(
          `unable to update subject roles for unimelb username ${username}`,
          e
        )
      );
  });
};

export const acceptTerms = async (user) => {
  try {
    await user.send(EULA);
    let dmChan = await user.createDM();
    await dmChan.awaitMessages((m) => _.toUpper(m.content) === "AGREE", {
      max: 1,
      time: 90000,
      errors: ["time"],
    });
    return true;
  } catch (e) {
    user.send(TOSErrorMessage);
    logger.warn(`Error on new user accepting TOS: ${user.username}`, e);
    return false;
  }
};

export const matchRoles = async (client) => {
  try {
    let entries = await asyncClient.hgetall("registered");
    let server = await client.guilds.cache.get(DISCORD_SERVER_ID, true);
    let members = await server.members.fetch();

    await Promise.all(
      members.map(async (member) => {
        let canvasUsername = entries ? entries[member.id] : undefined;
        let discordRoles = getDiscordRoleNames(member);

        // ignore, manual job
        if (discordRoles.length != 0 && !canvasUsername) return;

        // they have a registered username but may be missing roles
        if (canvasUsername) {
          let canvasRoles = await getRoles(canvasUsername);
          let discordRoles = getDiscordRoleNames(member);
          let roleDiff = _.difference(canvasRoles.sort(), discordRoles.sort());

          if (roleDiff.length != 0) {
            logger.warn(
              `Found an un-synced user: ${canvasUsername}-${
                member.displayName
              }! added roles ${roleDiff.toString()}`
            );
            setupUser(client, member.user, canvasUsername);
          }
        } else {
          let haveReminded = await asyncClient.exists(
            `reminded=${member.id}`,
            member.id
          );
          // remind them if required.
          if (!haveReminded && !member.user.bot) {
            asyncClient.set(`reminded=${member.id}`, member.id);
            asyncClient.expire(`reminded=${member.id}`, 60 * 60 * 24);
            member.send(KickWarningMessage(member.displayName));
            logger.warn(KickWarningLog(member.displayName));
          }
        }
      })
    );
  } catch (e) {
    console.error(e);
  }
};
