"use strict";

import dotenv from "dotenv";
dotenv.config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN.toString();

export const MAIL_ADDRESS = process.env.MAIL_ADDRESS.toString();

export const MAIL_PW = process.env.MAIL_PW.toString();

export const SERVER_ID = process.env.SERVER_ID.toString();

/* retried authentication per discord account, before banning*/
export const MAX_RETRIES = 15;

/* a k:v mapping of canvas course_id to the name you wish to give the subject on discord */
export const COURSE_ID = { 105430: "comp90015" };

export const EMAIL_SUBJECT = "Dist. Computing Discord Server";

export const EMAIL_SUFFIX = "@student.unimelb.edu.au";

export const CODE_PREFIX = "dcmp@";
