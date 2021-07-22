"use strict";

import redis from "redis";
import { REDIS_HOST } from "./config.js";
import { logger } from "./logger.js";

export const subscriber = redis.createClient({ host: REDIS_HOST });
export const publisher = redis.createClient({ host: REDIS_HOST });

export const DISCUSSIONS_CHANNEL = (courseId) =>
  `${courseId}:DISCUSSIONS_CHANNEL`;
export const MODULES_CHANNEL = (courseId) => `${courseId}:MODULES_CHANNEL`;
export const ANNOUNCEMENTS_CHANNEL = (courseId) =>
  `${courseId}:ANNOUNCEMENTS_CHANNEL`;

subscriber.on("error", function (error) {
  logger.log({
    level: "error",
    message: "redis subscriber error",
    error: error,
  });
});

publisher.on("error", function (error) {
  logger.log({
    level: "error",
    message: "redis publisher error",
    error: error,
  });
});
