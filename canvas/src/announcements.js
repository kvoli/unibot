"use strict";

import { getOptions, getDiscussionTopics } from "node-canvas-api";
import { shouldPublish } from "./util.js";

export const getAnnouncements = async (courseId) => {
  const allAnnouncements = await getDiscussionTopics(
    courseId,
    getOptions.discussion.only_announcements
  );

  const announcements = allAnnouncements.filter((a) =>
    shouldPublish(a.published, a.delayed_post_at)
  );

  return { announcements };
};
