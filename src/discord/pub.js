import { getCourseChannel } from "./disco.js";
import { WHITELISTED_MODULE_TYPES } from "../../config.js";
import {
  DiscussionMessage,
  AnnouncementMessage,
  ModuleMessage,
} from "./messages.js";

export const publishAnnouncement = (client, course, message) => {
  getCourseChannel(client, course, "announcements")
    .then((chan) => {
      chan.send(AnnouncementMessage(message));
    })
    .catch(console.error);
};

export const publishDiscussion = (client, course, message) => {
  getCourseChannel(client, course, "updates")
    .then((chan) => {
      chan.send(DiscussionMessage(message));
    })
    .catch(console.error);
};

export const publishModule = (client, course, message) => {
  if (!message.published || !WHITELISTED_MODULE_TYPES.has(message.type)) return;
  getCourseChannel(client, course, "updates")
    .then((chan) => {
      chan.send(ModuleMessage(message));
    })
    .catch(console.error);
};
