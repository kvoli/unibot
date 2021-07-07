"use strict";

import _ from "lodash";
import {
  getModules,
  getOptions,
  getDiscussionTopics,
  getFullDiscussion,
} from "node-canvas-api";

export const getUpdates = async (courseId) => {
  const modules = await getModules(courseId, getOptions.module.include.items);
  const discussions = await getDiscussionDetails(courseId);

  console.log(modules);

  return { modules, discussions };
};

const getDiscussionDetails = async (courseId) => {
  const discussions = await getDiscussionTopics(courseId);

  const ret = discussions.map(async (topic) => {
    const details = await getFullDiscussion(courseId, topic.id);
    return parseTopicDetail(topic, details);
  });

  return await Promise.all(ret);
};

const parseTopicDetail = (topic, details) => {
  const parties = {};
  details.participants.forEach((p) => (parties[p.id] = p));
  return _.flatMapDeep(details.view, (post) =>
    parseMessage(post, parties, topic.title, topic.html_url)
  );
};

const parseMessage = (post, authors, title, url) => {
  const ret = [
    {
      id: post.id,
      created_at: post.created_at,
      message: post.message,
      topicTitle: title,
      author: authors[post.user_id],
      url: url,
    },
  ];
  if (!post.replies) {
    return ret;
  }

  return _.concat(
    ret,
    _.flatMapDeep(post.replies, (p) => parseMessage(p, authors, title, url))
  );
};
