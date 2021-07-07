import nodemailer from "nodemailer";

import {
  MAIL_ADDRESS,
  MAIL_PW,
  STAFF_EMAIL_SUFFIX,
  STUDENT_EMAIL_SUFFIX,
  EMAIL_SUBJECT,
} from "../../config.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_ADDRESS,
    pass: MAIL_PW,
  },
});

const getMailOptions = (username, code, staff) => ({
  from: MAIL_ADDRESS,
  to: `${username}${staff ? STAFF_EMAIL_SUFFIX : STUDENT_EMAIL_SUFFIX}`,
  subject: `${EMAIL_SUBJECT}`,
  text: code,
});

export const sendMail = (username, code, staff) =>
  transporter.sendMail(getMailOptions(username, code, staff));
