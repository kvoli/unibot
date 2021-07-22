"use strict";

import dotenv from "dotenv";

dotenv.config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN.toString();

export const MAIL_ADDRESS = process.env.MAIL_ADDRESS.toString();

export const MAIL_PW = process.env.MAIL_PW.toString();

export const SERVER_ID = process.env.DISCORD_SERVER_ID.toString();

export const REDIS_HOST = process.env.REDIS_HOST.toString();

export const DISCORD_LOG_WEBHOOK = process.env.DISCORD_LOG_WEBHOOK.toString();

/* retried authentication per discord account, before banning*/

export const WHITELISTED_CHANNELS = new Set(
  process.env.WHITELISTED_CHANNELS.toString().split(",")
);

export const EMAIL_SUBJECT_LINE = process.env.EMAIL_SUBJECT_LINE.toString();

export const STAFF_EMAIL_SUFFIX = process.env.STAFF_EMAIL_SUFFIX.toString();

export const STUDENT_EMAIL_SUFFIX = process.env.STAFF_EMAIL_SUFFIX.toString();

export const CODE_PREFIX = "unibot@";

export const BYPASS_CONFIG = new Map([]);

/* The number of minutes to wait between updating canvas information*/
export const CANVAS_UPDATE_INTERVAL =
  process.env.CANVAS_UPDATE_INTERVAL.toString();

/* a k:v mapping of canvas course_id to the name you wish to give the subject on discord */
export const COURSE_ID = new Map(
  process.env.COURSE_ID.toString()
    .split(",")
    .map((e) => e.split(":"))
);

/* The modules to publish announcements on */
export const WHITELISTED_MODULE_TYPES = new Set(
  process.env.WHITELISTED_MODULE_TYPES.toString().split(",")
);
