const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (mailOptions) => {
    return transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (user, verificationLink) => {
    const mailOptions = {
        from: '"sipartan" <sipartan@gmail.com>',
        to: user.email,
        subject: 'Email Verification',
        text: `Hello ${user.nama},\nPlease verify your email by clicking the link: ${verificationLink}`,
        html: `<p>Hello ${user.nama},</p><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a>`,
    };

    return transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (user, resetLink) => {
    const mailOptions = {
        from: '"sipartan" <sipartan@gmail.com>',
        to: user.email,
        subject: 'Reset Password',
        text: `Hello ${user.nama},\nYou can reset your password by clicking the link: ${resetLink}`,
        html: `<p>Hello ${user.nama},</p><p>You can reset your password by clicking the link below:</p><a href="${resetLink}">Reset Password</a>`,
    };

    return sendEmail(mailOptions);
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };