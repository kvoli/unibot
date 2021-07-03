import { getCourseChannel } from "./disco.js";
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
  if (!message.published) return;
  getCourseChannel(client, course, "updates")
    .then((chan) => {
      chan.send(ModuleMessage(message));
    })
    .catch(console.error);
};
