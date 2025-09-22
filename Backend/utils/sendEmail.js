import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail address from .env
            pass: process.env.EMAIL_PASS, // Your App Password from .env
        },
    });

    // 2. Define the email options
    const mailOptions = {
        from: `LivestockIQ <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments, // THIS LINE IS THE FIX
    };

    // 3. Send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export default sendEmail;