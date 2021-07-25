"use strict";

import _ from "lodash";
import {
  getModules,
  getOptions,
  getDiscussionTopics,
  getFullDiscussion,
} from "node-canvas-api";
import getFile from "node-canvas-api/src/getFile";
import { WHITELISTED_MODULE_TYPES } from "./config.js";
import { shouldPublish } from "./util.js";

export const getUpdates = async (courseId) => {
  const allModules = await getModules(
    courseId,
    getOptions.module.include.items
  );

  const discussions = await getDiscussionDetails(courseId);

  const unmappedModules = filterModuleTypes(allModules);
  const modules = await getFiles(unmappedModules);

  return { modules, discussions };
};

const filterModuleTypes = (modules) =>
  modules.flatMap((module) =>
    module.items
      .map((moduleItem) => Object.assign({ parent: module.name }, moduleItem))
      .filter(
        (moduleItem) =>
          WHITELISTED_MODULE_TYPES.has(moduleItem.type) && moduleItem.published
      )
  );

const getDiscussionDetails = async (courseId) => {
  const discussions = await getDiscussionTopics(courseId);
  const published = discussions.filter((topic) =>
    shouldPublish(topic.published, topic.delayed_post_at)
  );

  const ret = published.map(async (topic) => {
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

const getFiles = async (moduleItems) => {
  let ret = await Promise.all(
    moduleItems.map(async (item) => {
      if (item.type !== "File") return item;
      let file = await getFile(item.content_id);
      return Object.assign({ file: file.url, filename: file.filename }, item);
    })
  );
  return ret;
};
