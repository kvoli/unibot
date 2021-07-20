import { getCourseChannel } from "./disco.js";
import { WHITELISTED_MODULE_TYPES } from "../../config.js";
import {
  DiscussionMessage,
  AnnouncementMessage,
  ModuleMessage,
} from "./messages.js";
import { logger } from "../util/logger.js";

export const publishAnnouncement = (client, course, message) => {
  getCourseChannel(client, course, "announcements")
    .then((chan) => {
      chan.send(AnnouncementMessage(message));
    })
    .catch((e) =>
      logger.log({
        level: "error",
        message: `unable to publish announcement`,
        error: e,
      })
    );
};

export const publishDiscussion = (client, course, message) => {
  getCourseChannel(client, course, "updates")
    .then((chan) => {
      chan.send(DiscussionMessage(message));
    })
    .catch((e) =>
      logger.log({
        level: "error",
        message: `unable to publish discussion`,
        error: e,
      })
    );
};

export const publishModule = (client, course, message) => {
  if (!message.published || !WHITELISTED_MODULE_TYPES.has(message.type)) return;
  getCourseChannel(client, course, "updates")
    .then((chan) => {
      chan.send(ModuleMessage(message));
    })
    .catch((e) =>
      logger.log({
        level: "error",
        message: `unable to publish module update`,
        error: e,
      })
    );
};
