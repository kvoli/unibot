import nodemailer from "nodemailer";

import {
  MAIL_ADDRESS,
  MAIL_PW,
  EMAIL_SUFFIX,
  EMAIL_SUBJECT,
} from "../../config.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_ADDRESS,
    pass: MAIL_PW,
  },
});

const getMailOptions = (username, code) => ({
  from: MAIL_ADDRESS,
  to: `${username}${EMAIL_SUFFIX}`,
  subject: `${EMAIL_SUBJECT}`,
  text: code,
});

export const sendMail = (username, code) =>
  transporter.sendMail(getMailOptions(username, code));
