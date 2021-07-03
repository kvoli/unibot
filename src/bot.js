"use strict";

import Discord from "discord.js";
import { DISCORD_TOKEN, SERVER_ID } from "../config.js";
import pkg from "lodash";
const { noop, toUpper } = pkg;
import { sendMail } from "./util/mail.js";
import {
  shouldAttemptAuth,
  startRego,
  addCodeBlockedRole,
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
  if (!shouldAttemptAuth(client, messageReaction, user)) return;

  user.send(
    "Please enter your unimelb username `user=yourusername` e.g. user=bot"
  );

  user
    .createDM()
    .then((channel) =>
      channel.awaitMessages((m) => m.content.startsWith("user="), {
        max: 1,
        time: 60000,
        errors: ["time"],
      })
    )
    .then((collected) => {
      const username = collected.last().toString().slice(5);
      const code = startRego(user, username);
      return sendMail(username, code);
    })
    .then((_) => {
      user.send(
        "Sent verification email, please check student inbox + spam and paste the code below. You have 5 minutes :D"
      );
      user
        .createDM()
        .then((channel) =>
          channel.awaitMessages((m) => m.content.startsWith("dcmp@"), {
            max: 1,
            time: 5 * 60000,
            errors: ["time"],
          })
        )
        .then((col) => addCodeBlockedRole(client, col.last(), "student"))
        .catch(console.error);
    })
    .catch((err) =>
      user.send(
        "Sorry, you took too long to respond. Try re-reacting to the emoji."
      )
    );
});

subscriber.subscribe(DISCUSSIONS_CHANNEL("comp90015"));
subscriber.subscribe(ANNOUNCEMENTS_CHANNEL("comp90015"));
subscriber.subscribe(MODULES_CHANNEL("comp90015"));

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
