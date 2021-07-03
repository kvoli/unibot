'use strict'

require('dotenv').config()

const DISCORD_TOKEN = process.env.DISCORD_TOKEN.toString()

const MAIL_ADDRESS = process.env.MAIL_ADDRESS.toString()

const MAIL_PW = process.env.MAIL_PW.toString()

const SERVER_ID = process.env.SERVER_ID.toString()

/* retried authentication per discord account, before banning*/
const MAX_RETRIES = 15

/* a k:v mapping of canvas course_id to the name you wish to give the subject on discord */
const COURSE_ID = { 105430: 'comp90015' }

const EMAIL_SUBJECT = 'Dist. Computing Discord Server'

const EMAIL_SUFFIX = '@student.unimelb.edu.au'

const CODE_PREFIX = 'dcmp@'

module.exports = {
  DISCORD_TOKEN,
  MAIL_ADDRESS,
  MAIL_PW,
  SERVER_ID,
  MAX_RETRIES,
  COURSE_ID,
  EMAIL_SUBJECT,
  EMAIL_SUFFIX,
  CODE_PREFIX,
}
