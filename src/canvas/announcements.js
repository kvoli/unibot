"use strict";

import { getOptions, getDiscussionTopics } from "node-canvas-api";

export const getAnnouncements = async (courseId) => {
  const announcements = await getDiscussionTopics(
    courseId,
    getOptions.discussion.only_announcements
  );

  return { announcements };
};
