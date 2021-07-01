const nodemailer = require('nodemailer')

const {
  MAIL_ADDRESS,
  MAIL_PW,
  EMAIL_SUFFIX,
  EMAIL_SUBJECT,
  CODE_PREFIX,
} = require('../../config')

const genCode = () =>
  CODE_PREFIX + Math.trunc(Math.random() * 1e16).toString(16)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_ADDRESS,
    pass: MAIL_PW,
  },
})

const getMailOptions = (username, code) => ({
  from: MAIL_ADDRESS,
  to: `${username}${EMAIL_SUFFIX}`,
  subject: `${EMAIL_SUBJECT}`,
  text: code,
})

const sendMail = (username, code) =>
  transporter.sendMail(getMailOptions(username, code))

module.exports.sendMail = sendMail
