const nodemailer = require('nodemailer')

const {
  MAIL_ADDRESS,
  MAIL_PW,
  EMAIL_SUFFIX,
  EMAIL_SUBJECT,
} = require('../../config')

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
