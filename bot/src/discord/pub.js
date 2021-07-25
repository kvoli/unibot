import { getCourseChannel } from "./disco.js";
import {
  DiscussionMessage,
  AnnouncementMessage,
  ModuleMessage,
  ModuleFileMessage,
} from "./messages.js";

export const publishAnnouncement = (client, course, message, cb) =>
  getCourseChannel(client, course, "announcements")
    .then((chan) =>
      chan
        .send(AnnouncementMessage(message))
        .then(cb(undefined))
        .catch((err) => cb(err))
    )
    .catch((err) => cb(err));

export const publishDiscussion = (client, course, message, cb) =>
  getCourseChannel(client, course, "updates")
    .then((chan) => chan.send(DiscussionMessage(message)).then(cb(undefined)))
    .catch((err) => cb(err));

export const publishModule = (client, course, message, cb) =>
  getCourseChannel(client, course, "updates")
    .then((chan) => chan.send(ModuleMessage(message)).then(cb(undefined)))
    .catch((err) => cb(err));

export const publishFileModule = (client, course, message, cb) =>
  getCourseChannel(client, course, "updates")
    .then((chan) => chan.send(ModuleFileMessage(message)).then(cb(undefined)))
    .catch((err) => cb(err));
