const Email = require('email-templates');
const path = require('path');
const constants = require('../constants');

const sendEmail = async (to, subject, template, locals) => {
    try {
        const email = new Email({
            template: path.join(__dirname, '..', '..', 'emails', template),

            message: {
                from: constants.emailSenderName,
                subject,
                to,
            },
            locals: { ...locals },
            send: true,
            transport: {
                host: "yenoma.com",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                  user: process.env.EMAIL,
                  pass: process.env.EMAIL_PASS,
                },
            }
        });

        return await email.send({
            template: template,
            locals: { ...locals },
        });
    } catch (error) {
        throw error;
    }
}

module.exports = {
    sendEmail
}