"use strict";

import dotenv from "dotenv";
dotenv.config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN.toString();

export const MAIL_ADDRESS = process.env.MAIL_ADDRESS.toString();

export const MAIL_PW = process.env.MAIL_PW.toString();

export const SERVER_ID = process.env.SERVER_ID.toString();

export const REDIS_HOST = process.env.REDIS_HOST.toString();

export const DISCORD_LOG_WEBHOOK = process.env.DISCORD_LOG_WEBHOOK.toString();

/* retried authentication per discord account, before banning*/
export const MAX_RETRIES = 15;

export const WHITELISTED_CHANNELS = new Set([
  "teaching",
  "updates",
  "announcements",
  "notify",
  "welcome",
]);

export const EMAIL_SUBJECT = "CIS Systems Subject Discord Server";

export const STAFF_EMAIL_SUFFIX = "@unimelb.edu.au";

export const STUDENT_EMAIL_SUFFIX = "@student.unimelb.edu.au";

export const CODE_PREFIX = "dcmp@";

export const BYPASS_CONFIG = new Map([]);

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
