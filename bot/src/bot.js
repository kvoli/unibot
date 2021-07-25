"use strict";

import { Intents, Client } from "discord.js";
import {
  DISCORD_TOKEN,
  DISCORD_SERVER_ID,
  COURSE_ID,
  CODE_PREFIX,
  WHITELISTED_CHANNELS,
  BYPASS_CONFIG,
} from "./config.js";
import pkg from "lodash";
const { noop, toUpper } = pkg;
import { sendMail } from "./util/mail.js";
import { getRoles, shouldAttemptAuth } from "./discord/disco";

import {
  startRego,
  acceptTerms,
  completeCodeAuth,
  setupUser,
  startSession,
  matchRoles,
} from "./discord/update.js";
import {
  subscriber,
  DISCUSSIONS_CHANNEL,
  MODULES_CHANNEL,
  ANNOUNCEMENTS_CHANNEL,
} from "./db/redis.js";

import {
  publishAnnouncement,
  publishModule,
  publishDiscussion,
  publishFileModule,
} from "./discord/pub.js";
import { EULAPinned, StarterMessage } from "./discord/messages.js";
import { logger } from "./util/logger.js";
import retry from "retry";

const intents = new Intents([Intents.NON_PRIVILEGED, "GUILD_MEMBERS"]);
const client = new Client({ ws: { intents } });

client.on("ready", async () => {
  try {
    let server = await client.guilds.fetch(DISCORD_SERVER_ID, true, true);
    // check the system channel has the starter message
    let pinned = await server.systemChannel.messages.fetchPinned();
    pinned.size < 1
      ? server.systemChannel.send(StarterMessage).then((msg) => msg.pin())
      : noop();
    // check all channels have an EULA message
    server.channels.cache.map(async (channel) => {
      let chan = await channel.fetch();
      if (chan.type === "text" && !WHITELISTED_CHANNELS.has(chan.name)) {
        let pinnedMessages = await chan.messages.fetchPinned();
        pinnedMessages.size < 1
          ? chan.send(EULAPinned).then((msg) => msg.pin())
          : noop();
      }
    });
  } catch (e) {
    logger.error("unable to update pinned messages", e);
  }
});

client.on("messageReactionAdd", async (messageReaction, user) => {
  let attempt = await shouldAttemptAuth(client, messageReaction, user);
  if (!attempt) return;

  if (BYPASS_CONFIG.has(user.id)) {
    setupUser(client, user, BYPASS_CONFIG.get(user.id));
    return;
  }

  await startSession(user);

  logger.info(`${user.username} has started an auth session.`);

  let accepted = await acceptTerms(user);
  if (!accepted) return;

  await user.send(
    "Please enter your unimelb username `user=yourusername`,\n this should be the prefix for your email address e.g. james bond would commonly = `user=jbond`.\n This is not case sensistive."
  );

  let dmChan = await user.createDM();

  try {
    let userResponse = await dmChan.awaitMessages(
      (m) => m.content.startsWith("user="),
      {
        max: 1,
        time: 60000,
        errors: ["time"],
      }
    );

    let username = userResponse.last().toString().slice(5);
    let code = startRego(user, username);

    let userRoles = await getRoles(username);
    let staff = userRoles.includes("teaching");

    let sentMail = await sendMail(username, code, staff);

    logger.warn(
      `sent verification email to ${username}, with code: ${code}: info ${sentMail.response}. staff: ${staff}`
    );

    await user.send(
      "Sent verification email, please check email inbox + spam and paste the code below. You have 5 minutes :D"
    );

    let enteredCode = await dmChan.awaitMessages(
      (m) => m.content.startsWith(CODE_PREFIX),
      {
        max: 1,
        time: 5 * 60000,
        errors: ["time"],
      }
    );

    completeCodeAuth(client, enteredCode.first());
  } catch (e) {
    user.send(
      "Sorry, you took too long to respond. Try re-reacting to the emoji."
    );
    logger.error(`unable to complete email auth user: ${user.username}`, e);
    return;
  }
});

COURSE_ID.forEach((course) => {
  subscriber.subscribe(DISCUSSIONS_CHANNEL(course));
  subscriber.subscribe(ANNOUNCEMENTS_CHANNEL(course));
  subscriber.subscribe(MODULES_CHANNEL(course));
});

subscriber.on("message", (channel, message) => {
  let [course, chan] = channel.split(":");
  let msg = JSON.parse(message);
  let crs = toUpper(course);
  console.log("new msg ", message, channel);

  faultyPublish(client, chan, crs, msg, (err) =>
    logger.log({
      level: err ? "error" : "info",
      message: err
        ? `unable to publish message  after retrying to ${crs}:${chan}`
        : `published message new msg to ${crs}:${chan}`,
      error: err,
    })
  );
});

const faultyPublish = (client, chan, crs, msg, cb) => {
  let operation = retry.operation({ retries: 1 });

  operation.attempt(function (currentAttempt) {
    switch (chan) {
      case "DISCUSSIONS_CHANNEL": {
        publishDiscussion(client, crs, msg, function (err) {
          if (operation.retry(err)) return;
          cb(err ? operation.mainError() : null);
        });
        break;
      }
      case "MODULES_CHANNEL": {
        if (msg.type == "File") {
          publishFileModule(client, crs, msg, function (err) {
            if (operation.retry(err)) return;
            cb(err ? operation.mainError() : null);
          });
        } else {
          publishModule(client, crs, msg, function (err) {
            if (operation.retry(err)) return;
            cb(err ? operation.mainError() : null);
          });
        }
        break;
      }
      case "ANNOUNCEMENTS_CHANNEL": {
        publishAnnouncement(client, crs, msg, function (err) {
          if (operation.retry(err)) return;
          cb(err ? operation.mainError() : null);
        });
        break;
      }
    }
  });
};
client.login(DISCORD_TOKEN);

const hackyStuff = () => {
  matchRoles(client).then().catch(console.error);
};

// run every 10 mins
setInterval(hackyStuff, 1000 * 60 * 10);
