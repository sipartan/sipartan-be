const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.email.user,
        pass: config.email.password,
    },
});

/**
 * Sends an email with the given mail options.
 * @param {Object} mailOptions - Nodemailer mail options.
 * @returns {Promise<void>}
 */
const sendEmail = async (mailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${mailOptions.to}`);
    } catch (error) {
        logger.error(`Failed to send email to ${mailOptions.to}:`, error);
        throw error;
    }
};

/**
 * Sends a verification email to the user.
 * @param {Object} user - The user object containing an email and name.
 * @param {string} verificationLink - A link to verify the user's email.
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (user, verificationLink) => {
    const mailOptions = {
        from: '"sipartan" <sipartan@gmail.com>',
        to: user.email,
        subject: 'Email Verification',
        text: `Hello ${user.nama},\nPlease verify your email by clicking the link: ${verificationLink}`,
        html: `<p>Hello ${user.nama},</p><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a>`,
    };

    return sendEmail(mailOptions);
};

/**
 * Sends a reset password email to the user.
 * @param {Object} user - The user object containing an email and name.
 * @param {string} resetLink - A link to reset the user's password.
 * @returns {Promise<void>}
 */
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

module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail,
};