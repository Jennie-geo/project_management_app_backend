"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require('nodemailer');
require('dotenv').config();
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.BASE_EMAIL,
        pass: process.env.BASE_PASS,
    }
});
const sendMail = (email, body) => {
    let mailOptions = {
        from: `Project Management Team`,
        to: email,
        subject: 'Account activation link',
        html: body
    };
    return transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            console.log('Error Occurs: ', err);
        }
        console.log('Email sent!!:' + data);
    });
};
exports.default = sendMail;
