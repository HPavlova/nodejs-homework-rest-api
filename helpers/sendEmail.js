const nodemailer = require("nodemailer");
require("dotenv").config();

const { META_PASSWORD } = process.env;

const transporter = nodemailer.createTransport({
  host: "smtp.meta.ua",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "pavlova.aa@meta.ua",
    pass: META_PASSWORD,
  },
});

const sendEmail = async (data) => {
  try {
    const email = { ...data, from: "pavlova.aa@meta.ua" };
    await transporter.sendMail(email);
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = sendEmail;
