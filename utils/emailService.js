const { Resend } = require('resend');
const dotenv = require('dotenv');

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
    try {
        const data = await resend.emails.send({
            // Using your verified domain temporarily
            from: 'Technical Training Center <no-reply@technicalcomputer.tech>', 
            to: [to],
            subject: subject,
            html: html,
        });
        
        console.log('Email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('Email sending failed:', error);
        // We don't throw error here to prevent crashing the main request
        return null;
    }
};

module.exports = sendEmail;
