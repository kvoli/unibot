import { asyncClient } from "../db/redis.js";
import { DISCORD_SERVER_ID, CODE_PREFIX } from "../config.js";
import {
  AlreadyRegisteredMessage,
  AlreadyInProgressMessage,
} from "./messages.js";
import _ from "lodash";
import { logger } from "../util/logger.js";

export const getRole = async (client, roleName) => {
  let guild = await client.guilds.fetch(DISCORD_SERVER_ID);
  return guild.roles.cache.find((role) => role.name === roleName);
};

export const getRoles = async (username) =>
  await asyncClient.smembers(_.toLower(username));

export const getRego = async (userId) =>
  await asyncClient.get(`inprog:${userId}`);

const getUser = (user) => asyncClient.hget("registered", user.id);

export const genCode = () =>
  CODE_PREFIX + Math.trunc(Math.random() * 1e16).toString(16);

export const getDiscordRoleNames = (discordUser) =>
  discordUser.roles.cache
    .map((role) => role.name)
    .filter((role) => role !== "@everyone");

export const getFirstChannelByName = async (client, channelName) => {
  let guild = await client.guilds.fetch(DISCORD_SERVER_ID);
  return guild.channels.cache.find((value) => {
    return value.name == channelName;
  });
};

export const getCourseChannel = async (client, course, channel) => {
  let guild = await client.guilds.fetch(DISCORD_SERVER_ID, true, true);
  return guild.channels.cache.find(
    (value) =>
      value.type == "text" &&
      value.name == channel &&
      value.parent &&
      value.parent.name == course
  );
};

export const getCanvasUserInfo = async (canvasUsername) => {
  let userRoles = await getRoles(_.toLower(canvasUsername));
  let isStaff = userRoles.includes("teaching");

  let subject = userRoles.filter((v) => {
    if (isStaff) return v !== "teaching" && !v.endsWith("staff");
    return v !== "student";
  });

  let canvasSubject = subject.shift();

  let rawRoles = await (isStaff
    ? asyncClient.hget(canvasSubject, "staff")
    : asyncClient.hget(canvasSubject, "students"));
  let roleDb = JSON.parse(rawRoles);
  return roleDb.filter((e) => e.user.login_id === canvasUsername).shift();
};

export const shouldAttemptAuth = async (client, messageReaction, user) => {
  // if the reaction was not on one of our messages, ignore
  if (!messageReaction.message.author.equals(client.user)) {
    return false;
  }

  // have already reacted on a timer, ignore
  if (await asyncClient.get(`reacted+${user.id}`)) {
    logger.info(AlreadyInProgressMessage(user.username));
    return false;
  }

  // user already registered, ignore
  if (await getUser(user)) {
    user.send(AlreadyRegisteredMessage(user.username));
    logger.info(AlreadyRegisteredMessage);
    return false;
  }

  // already have an active email sesion, ignore
  if (await getRego(user)) {
    logger.info(AlreadyInProgressMessage(user.username));
    return false;
  }

  return true;
};
