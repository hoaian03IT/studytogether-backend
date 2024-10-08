const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    port: 465,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD,
    },
    service: "gmail",
    host: "smtp.gmail.com",
});

module.exports = { transporter };
