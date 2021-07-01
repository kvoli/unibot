'use strict'

require('dotenv').config()

module.exports.DISCORD_TOKEN = process.env.DISCORD_TOKEN.toString()

module.exports.MAIL_ADDRESS = process.env.MAIL_ADDRESS.toString()

module.exports.MAIL_PW = process.env.MAIL_PW.toString()

module.exports.SERVER_ID = process.env.SERVER_ID.toString()

/* retried authentication per discord account, before banning*/
module.exports.MAX_RETRIES = 15

/* a k:v mapping of canvas course_id to the name you wish to give the subject on discord */
module.exports.COURSE_ID = { 105430: 'comp90015' }

module.exports.EMAIL_SUBJECT = 'Dist. Computing Discord Server'

module.exports.EMAIL_SUFFIX = '@student.unimelb.edu.au'

module.exports.CODE_PREFIX = 'dcmp@'
