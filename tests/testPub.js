"use strict";

import _ from "lodash";
const { noop } = _;
import {
  getEnrollmentsInCourse,
  getModules,
  getOptions,
  getDiscussionTopics,
  getDiscussionTopic,
  getFullDiscussion,
} from "node-canvas-api";

import { publisher, DISCUSSIONS_CHANNEL } from "../src/db/redis.js";

const updateState = async (courseId) => {
  const discussions = await getDiscussionDetails(courseId);
  return { discussions };
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

const run = async (courseId) => {
  console.log("started run");
  const { discussions } = await updateState(courseId);
  // students
  //  ? students.map((student) =>
  //      redis.publisher.sadd(`${student.user.login_id}`, `${courseId}`)
  //    )
  //  : noop()
  // modules
  //  ? modules.slice(0, 1).map((module) =>
  //      module.items.map((moduleItem) => {
  //        redis.publisher.publish(
  //          redis.MODULES_CHANNEL(courseMap[courseId]),
  //          JSON.stringify(moduleItem),
  //          (err, reply) =>
  //            console.log(
  //              'published moduleItem on',
  //              redis.MODULES_CHANNEL(courseMap[courseId]),
  //              err,
  //              reply,
  //              JSON.stringify(moduleItem).length
  //            )
  //        )
  //      })
  //    )
  //  : noop()
  discussions
    ? discussions
        .slice(0, 1)
        .map((disc) =>
          disc.map((post) =>
            publisher.publish(
              DISCUSSIONS_CHANNEL(courseMap[courseId]),
              JSON.stringify(post),
              (err, reply) =>
                console.log(
                  "published discussion on ",
                  DISCUSSIONS_CHANNEL(courseMap[courseId]),
                  err,
                  reply,
                  JSON.stringify(post)
                )
            )
          )
        )
    : noop();

  // announcements
  //  ? announcements.slice(0, 1).map((ann) => {
  //      redis.publisher.publish(
  //        redis.ANNOUNCEMENTS_CHANNEL(courseMap[courseId]),
  //        JSON.stringify(ann),
  //        (err, reply) =>
  //          console.log(
  //            'published announcement on',
  //            redis.ANNOUNCEMENTS_CHANNEL(courseMap[courseId]),
  //            err,
  //            reply,
  //            JSON.stringify(ann).length
  //          )
  //      )
  //    })
  //  : noop()
  console.log("completed run");
};

const courseMap = { 105430: "comp90015" };

run("105430");
