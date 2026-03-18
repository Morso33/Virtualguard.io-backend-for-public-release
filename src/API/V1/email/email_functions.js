const config = require('../../../../config.json');
const logger = require('../../../logging.js');
const fs = require('fs');
const con = require('../../../connection.js');


async function send_email(reciever_email, subject, content_html) {
    try
    {
        const nodemailer = require('nodemailer');
        let transporter = nodemailer.createTransport({
            host: "smtp-relay.sendinblue.com",
            port: 587,
            secure: false,
            auth: {
                user: "REDACTED",
                pass: "REDACTED"
            }
        });
        //Send the email
        transporter.sendMail({
            from: "VirtualGuard.io <DoNotReply@virtualguard.io>",
            to: reciever_email,
            subject: subject,
            html: content_html
        });
        return {status: "success"};
    }
    catch (error)
    {
        logger.log(logger.LOGTYPE.ERROR, error.stack);
        return {status: error, error: error};
    }
}

async function send_password_reset_email(reciever_email, reset_token) {
    try
    {
        const subject = "Password Reset Request";
        let webserver_url;
        if (config.env === "dev")
        {
            webserver_url = "REDACTED";
        }
        else
        {
            webserver_url = "https://virtualguard.io";
        }
        const content = '<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>Password Reset</title> <style> body { background-color: #1f1f1f; color: #ffffff; font-family: Arial, sans-serif; margin: 0; padding: 20px; } h1 { font-size: 24px; margin-bottom: 15px; } p { font-size: 18px; line-height: 1.6; margin-bottom: 20px; } .reset-link { display: inline-block; padding: 10px 20px; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px; } </style> </head> <body> <h1>Password Reset</h1> <p>Hello,</p> <p>If you have requested a password reset, please click the link below to proceed. If you did not make this request, you can safely ignore this email.</p> <p>The below link will expire in 15 minutes.</p> <p>Do not share this link with anyone.</p> <a href="' + webserver_url + '/p/forgot-password/set_new?reset_token=' + reset_token + '" class="reset-link">Reset Password</a> </body> </html>';

        const send_email_result = await send_email(reciever_email, subject, content);
        return send_email_result;
    }
    catch (error)
    {
        logger.log(logger.LOGTYPE.ERROR, error.stack);
        return {status: error, error: error};
    }
}

module.exports = {
    send_email,
    send_password_reset_email
};