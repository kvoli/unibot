"use strict";

import dotenv from "dotenv";
dotenv.config();

export const REDIS_HOST = process.env.REDIS_HOST.toString();

export const DISCORD_LOG_WEBHOOK = process.env.DISCORD_LOG_WEBHOOK.toString();

/* The number of minutes to wait between updating canvas information*/
export const CANVAS_UPDATE_INTERVAL = 5;

/* a k:v mapping of canvas course_id to the name you wish to give the subject on discord */
export const COURSE_ID = { 102263: "comp90015", 105676: "comp90025" };

/* The modules to publish announcements on */
export const WHITELISTED_MODULE_TYPES = new Set([
  "Page",
  "File",
  "ExternalUrl",
]);
