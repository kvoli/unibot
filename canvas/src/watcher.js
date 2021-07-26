"use strict";

import _ from "lodash";
import {
  publisher,
  DISCUSSIONS_CHANNEL,
  ANNOUNCEMENTS_CHANNEL,
  MODULES_CHANNEL,
} from "./redis.js";
import { getUpdates } from "./updates.js";
import { getAnnouncements } from "./announcements.js";
import { getMembers } from "./members.js";
import { CANVAS_UPDATE_INTERVAL, COURSE_ID } from "./config.js";
import { logger } from "./logger.js";

const courseMap = COURSE_ID;

const pubMembers = async (courseId) => {
  const { staff, students } = await getMembers(courseId);

  students
    ? students.map((student) => {
        publisher.sadd(`${student.user.login_id}`, `${courseMap[courseId]}`);
        publisher.sadd(`${student.user.login_id}`, `student`);
      })
    : _.noop();

  staff
    ? staff.map((staffMember) => {
        publisher.sadd(
          `${staffMember.user.login_id}`,
          `${courseMap[courseId]}`
        );
        publisher.sadd(
          `${staffMember.user.login_id}`,
          `${courseMap[courseId]}-staff`
        );
        publisher.sadd(`${staffMember.user.login_id}`, `teaching`);
      })
    : _.noop();

  students
    ? publisher.hset(
        `${courseMap[courseId]}`,
        "students",
        JSON.stringify(students)
      )
    : _.noop();
  staff
    ? publisher.hset(`${courseMap[courseId]}`, "staff", JSON.stringify(staff))
    : _.noop();
};

const pubUpdates = async (courseId) => {
  const { modules, discussions } = await getUpdates(courseId);
  modules
    ? modules.map((moduleItem) =>
        publisher.hexists(
          `${courseId}-modules`,
          moduleItem.id.toString(),
          (err, reply) => {
            if (!err && reply == 0) {
              publisher.hset(
                `${courseId}-modules`,
                moduleItem.id.toString(),
                JSON.stringify(moduleItem)
              );
              publisher.publish(
                MODULES_CHANNEL(courseMap[courseId]),
                JSON.stringify(moduleItem),
                (err, reply) =>
                  console.log(
                    "published moduleItem on",
                    MODULES_CHANNEL(courseMap[courseId]),
                    err,
                    reply,
                    JSON.stringify(moduleItem).length
                  )
              );
            }
          }
        )
      )
    : _.noop();
  discussions
    ? discussions.map((disc) =>
        disc.map((post) =>
          publisher.hexists(
            `${courseId}-posts`,
            post.id.toString(),
            (err, reply) => {
              if (!err && reply == 0) {
                publisher.hset(
                  `${courseId}-posts`,
                  post.id.toString(),
                  JSON.stringify(post)
                );
                publisher.publish(
                  DISCUSSIONS_CHANNEL(courseMap[courseId]),
                  JSON.stringify(post),
                  (err, reply) =>
                    console.log(
                      "published discussion on ",
                      DISCUSSIONS_CHANNEL(courseMap[courseId]),
                      err,
                      reply,
                      JSON.stringify(post).length
                    )
                );
              }
            }
          )
        )
      )
    : _.noop();
};

const pubAnnouncement = async (courseId) => {
  const { announcements } = await getAnnouncements(courseId);
  announcements
    ? announcements.map((ann) => {
        publisher.hexists(
          `${courseId}-announcements`,
          ann.id.toString(),
          (err, reply) => {
            if (!err && reply == 0) {
              publisher.hset(
                `${courseId}-announcements`,
                ann.id.toString(),
                JSON.stringify(ann)
              );
              publisher.publish(
                ANNOUNCEMENTS_CHANNEL(courseMap[courseId]),
                JSON.stringify(ann),
                (err, reply) =>
                  console.log(
                    "published announcement on",
                    ANNOUNCEMENTS_CHANNEL(courseMap[courseId]),
                    err,
                    reply,
                    JSON.stringify(ann).length
                  )
              );
            }
          }
        );
      })
    : _.noop();
};

const run = async (courseId) => {
  try {
    await pubAnnouncement(courseId);
    await pubUpdates(courseId);
    await pubMembers(courseId);
  } catch (e) {
    logger.log({
      level: "error",
      message: "canvas watcher run failure",
      error: e,
    });
  }
};

Object.keys(COURSE_ID).map((course) => {
  // run once immediately
  run(course.toString());
  setInterval(run, CANVAS_UPDATE_INTERVAL * 60 * 1000, course.toString());
});
