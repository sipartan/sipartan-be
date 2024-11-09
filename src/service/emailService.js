const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    sendVerificationEmail = async (user, verificationLink) => {
        const mailOptions = {
            from: '"Your App Name" <yourapp@example.com>',
            to: user.email,
            subject: 'Email Verification',
            text: `Hello ${user.nama},\nPlease verify your email by clicking the link: ${verificationLink}`,
            html: `<p>Hello ${user.nama},</p><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a>`,
        };

        return this.transporter.sendMail(mailOptions);
    };
}

module.exports = new EmailService();
