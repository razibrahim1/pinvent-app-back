const nodemailer = require("nodemailer");

const sendEmail = async (subject, message, send_to, sent_from, reply_to) => {
    // Create an email transporter using environment variables
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT, // Use the port from the environment variable
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    // Options for sending the email
    const options = {
        from: sent_from,
        to: send_to,
        replyTo: reply_to,
        subject: subject,
        html: message,
    };

    try {
        // Send the email
        const info = await transporter.sendMail(options);

        // Log email information as JSON
        console.log(JSON.stringify({
            action: "Email Sent",
            from: sent_from,
            to: send_to,
            subject: subject,
            message: message,
            response: info.response,
        }, null, 2));
    } catch (error) {
        console.error(JSON.stringify({
            action: "Email Sending Error",
            error: error,
            from: sent_from,
            to: send_to,
            subject: subject,
            message: message,
        }, null, 2));
    }
};

module.exports = sendEmail;
