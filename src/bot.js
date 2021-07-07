"use strict";

import Discord from "discord.js";
import { DISCORD_TOKEN, SERVER_ID, COURSE_ID, CODE_PREFIX } from "../config.js";
import pkg from "lodash";
const { noop, toUpper } = pkg;
import { sendMail } from "./util/mail.js";
import {
  shouldAttemptAuth,
  startRego,
  addCodeBlockedRole,
  acceptTerms,
  getRoles,
} from "./discord/disco.js";
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
} from "./discord/pub.js";
import { StarterMessage } from "./discord/messages.js";

const client = new Discord.Client();

client.on("ready", async () => {
  client.guilds.fetch(SERVER_ID, false, true).then((server) =>
    server.systemChannel.messages
      .fetchPinned()
      .then((pinned) => {
        pinned.size < 1
          ? server.systemChannel.send(StarterMessage).then((msg) => msg.pin())
          : noop();
      })
      .catch(console.error)
  );
});

client.on("messageReactionAdd", async (messageReaction, user) => {
  const attempt = await shouldAttemptAuth(client, messageReaction, user);
  if (!attempt) return;

  const accepted = await acceptTerms(user);
  if (!accepted) return;

  await user.send(
    "Please enter your unimelb username `user=yourusername` e.g. user=bot"
  );

  const dmChan = await user.createDM();

  try {
    const userResponse = await dmChan.awaitMessages(
      (m) => m.content.startsWith("user="),
      {
        max: 1,
        time: 60000,
        errors: ["time"],
      }
    );

    const username = userResponse.last().toString().slice(5);
    const code = startRego(user, username);

    const userRoles = await getRoles(username);
    const staff = userRoles.includes("teaching");

    sendMail(username, code, staff);

    await user.send(
      "Sent verification email, please check email inbox + spam and paste the code below. You have 5 minutes :D"
    );

    const enteredCode = await dmChan.awaitMessages(
      (m) => m.content.startsWith(CODE_PREFIX),
      {
        max: 1,
        time: 5 * 60000,
        errors: ["time"],
      }
    );

    addCodeBlockedRole(client, enteredCode.first());
  } catch (e) {
    user.send(
      "Sorry, you took too long to respond. Try re-reacting to the emoji."
    );
    console.error(e);
    return;
  }
});

Object.values(COURSE_ID).map((course) => {
  subscriber.subscribe(DISCUSSIONS_CHANNEL(course));
  subscriber.subscribe(ANNOUNCEMENTS_CHANNEL(course));
  subscriber.subscribe(MODULES_CHANNEL(course));
});

//subscriber.subscribe(DISCUSSIONS_CHANNEL("comp90015"));
//subscriber.subscribe(ANNOUNCEMENTS_CHANNEL("comp90015"));
//subscriber.subscribe(MODULES_CHANNEL("comp90015"));

subscriber.on("message", (channel, message) => {
  const [course, chan] = channel.split(":");
  const msg = JSON.parse(message);
  const crs = toUpper(course);

  switch (chan) {
    case "DISCUSSIONS_CHANNEL": {
      publishDiscussion(client, crs, msg);
      break;
    }
    case "MODULES_CHANNEL": {
      publishModule(client, crs, msg);
      break;
    }
    case "ANNOUNCEMENTS_CHANNEL": {
      publishAnnouncement(client, crs, msg);
      break;
    }
  }
});

client.login(DISCORD_TOKEN);