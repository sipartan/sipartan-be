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
        html: `
            <div style="margin:auto;font-family:'Lato',sans-serif">
                <div style="background-color:#edf4f7;padding:20px 0;box-sizing:border-box;font-family:'Lato',sans-serif">
                    <div style="background-color:#fff;padding:16px 54px;max-width:692px;margin:0 auto">
                        <h1 style="margin:16px 0 8px 0;font-size:20px;line-height:28px;color:#212121;font-weight:700">
                            Hai ${user.nama},
                        </h1>
                        <p style="margin:0;font-size:16px;font-weight:400;line-height:24px;color:#212121">
                            Terima kasih telah mendaftar akun di Sipartan. Silakan klik tombol di bawah ini untuk memverifikasi email Kamu.
                        </p>
                        <div style="display:flex;margin:24px auto;width:160px;height:44px;background-color:#28a745;border:none;border-radius:4px;text-align:center">
                            <a href="${verificationLink}" style="margin:auto;text-decoration:none;color:white;font-weight:700;font-size:16px;line-height:24px" target="_blank">
                                Verifikasi Email
                            </a>
                        </div>
                        <p style="font-weight:400;color:#212121;margin:0 0 8px 0;font-size:16px;line-height:24px">
                            Tombol Verifikasi Email hanya berlaku selama <strong>24 jam.</strong>
                            Jika link telah kedaluwarsa, silakan kembali ke halaman pendaftaran untuk mengirim ulang email verifikasi.
                        </p>
                        <p style="margin:0;color:#212121;font-size:16px;line-height:24px">
                            Jika Kamu mempunyai pertanyaan atau mengalami kendala, hubungi
                            <a style="text-decoration:none;color:#212121;font-weight:bold" href="mailto:sipartan_support@gmail.com" target="_blank">
                                sipartan_support@gmail.com
                            </a>
                        </p>
                        <div style="font-size:16px;line-height:24px;font-weight:400;color:#424242;margin:32px 0">
                            <p style="margin:0">Terima kasih, <br>Administrator Sipartan</p>
                        </div>
                        <div style="height:0.5px;width:75%;margin:16px auto;background-color:#e0e0e0"></div>
                        <p style="font-size:12px;color:#828282;text-align:center;margin:0">
                            © 2025 Sipartan. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
            <em><span lang="EN-US"><strong style="color:#6c6c6c;font-family:Arial,sans-serif;font-size:9pt">---------------------<br>DISCLAIMER :</strong><br><font color="#6c6c6c" face="Arial, sans-serif"><span style="font-size:9pt">This 
electronic mail and/ or any files transmitted with it may contain confidential 
or copyright information of </span><span style="font-size:12px">SIPARTAN</span><span style="font-size:9pt">. and/ or its 
Subsidiaries.&nbsp;If you are not an intended recipient, you must not keep, forward, 
copy, use, or rely on this electronic mail, and any such action is unauthorized 
and prohibited. If you have received this electronic mail in error, please reply 
to this electronic mail to notify the sender of its incorrect delivery, and then 
delete both it and your reply. Finally, you should check this electronic mail 
and any attachments for the presence of viruses. </span><span style="font-size:12px">SIPARTAN</span><span style="font-size:9pt">. accepts no liability for any damages caused by any viruses transmitted by 
this electronic mail.</span></font></span></em></div></div></div>
        `,
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
        html: `
            <div style="margin:auto;font-family:'Lato',sans-serif">
                <div style="background-color:#edf4f7;padding:20px 0;box-sizing:border-box;font-family:'Lato',sans-serif">
                    <div style="background-color:#fff;padding:16px 54px;max-width:692px;margin:0 auto">
                        <h1 style="margin:16px 0 8px 0;font-size:20px;line-height:28px;color:#212121;font-weight:700">
                            Hai ${user.nama},
                        </h1>
                        <p style="margin:0;font-size:16px;font-weight:400;line-height:24px;color:#212121">
                            Kami mendapatkan permintaan untuk mengubah sandi akun Kamu. Silakan klik tombol di bawah ini untuk mengubah sandi.
                        </p>
                        <div style="display:flex;margin:24px auto;width:113px;height:44px;background-color:#cc1f31;border:none;border-radius:4px;text-align:center">
                            <a href="${resetLink}" style="margin:auto;text-decoration:none;color:white;font-weight:700;font-size:16px;line-height:24px" target="_blank">
                                Ubah Sandi
                            </a>
                        </div>
                        <p style="font-weight:400;color:#212121;margin:0 0 8px 0;font-size:16px;line-height:24px">
                            Tombol Ubah Sandi hanya dapat diklik <strong>satu kali dan berlaku selama 1 jam.</strong>
                            Jika melebihi durasi tersebut, silakan kembali ke halaman Log In dan klik Lupa Sandi.
                        </p>
                        <p style="margin:0;color:#212121;font-size:16px;line-height:24px">
                            Jika Kamu mempunyai pertanyaan atau mengalami kendala, hubungi
                            <a style="text-decoration:none;color:#212121;font-weight:bold" href="mailto:sipartan_support@gmail.com" target="_blank">
                                sipartan_support@gmail.com
                            </a>
                        </p>
                        <div style="font-size:16px;line-height:24px;font-weight:400;color:#424242;margin:32px 0">
                            <p style="margin:0">Terima kasih, <br>Administrator Sipartan</p>
                        </div>
                        <div style="height:0.5px;width:75%;margin:16px auto;background-color:#e0e0e0"></div>
                        <p style="font-size:12px;color:#828282;text-align:center;margin:0">
                            © 2025 Sipartan. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
            <em><span lang="EN-US"><strong style="color:#6c6c6c;font-family:Arial,sans-serif;font-size:9pt">---------------------<br>DISCLAIMER :</strong><br><font color="#6c6c6c" face="Arial, sans-serif"><span style="font-size:9pt">This 
electronic mail and/ or any files transmitted with it may contain confidential 
or copyright information of </span><span style="font-size:12px">SIPARTAN</span><span style="font-size:9pt">. and/ or its 
Subsidiaries.&nbsp;If you are not an intended recipient, you must not keep, forward, 
copy, use, or rely on this electronic mail, and any such action is unauthorized 
and prohibited. If you have received this electronic mail in error, please reply 
to this electronic mail to notify the sender of its incorrect delivery, and then 
delete both it and your reply. Finally, you should check this electronic mail 
and any attachments for the presence of viruses. </span><span style="font-size:12px">SIPARTAN</span><span style="font-size:9pt">. accepts no liability for any damages caused by any viruses transmitted by 
this electronic mail.</span></font></span></em></div></div></div>
        `,
    };

    return sendEmail(mailOptions);
};

module.exports = sendResetPasswordEmail;


module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail,
};