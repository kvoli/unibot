"use strict";

import asyncRedis from "async-redis";
import redis from "redis";

export const subscriber = redis.createClient();
export const publisher = redis.createClient();
export const asyncClient = asyncRedis.createClient();

export const DISCUSSIONS_CHANNEL = (courseId) =>
  `${courseId}:DISCUSSIONS_CHANNEL`;
export const MODULES_CHANNEL = (courseId) => `${courseId}:MODULES_CHANNEL`;
export const ANNOUNCEMENTS_CHANNEL = (courseId) =>
  `${courseId}:ANNOUNCEMENTS_CHANNEL`;

subscriber.on("error", function (error) {
  console.error(error);
});

publisher.on("error", function (error) {
  console.error(error);
});
