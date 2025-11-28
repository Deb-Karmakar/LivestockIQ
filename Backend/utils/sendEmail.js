// Backend/utils/sendEmail.js

import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced email sending utility with template support and retry logic
 */

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Send email with optional HTML template
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content (if using custom HTML)
 * @param {string} options.template - Template name (e.g., 'withdrawalAlert')
 * @param {Object} options.templateData - Data to pass to template
 * @param {Array} options.attachments - Email attachments
 * @param {number} options.retries - Number of retry attempts (default: 3)
 */
const sendEmail = async (options) => {
    const maxRetries = options.retries || 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const transporter = createTransporter();

            let htmlContent = options.html;

            // If template is specified, render it
            if (options.template && options.templateData) {
                const templatePath = path.join(__dirname, 'emailTemplates', `${options.template}.ejs`);
                htmlContent = await ejs.renderFile(templatePath, options.templateData);
            }

            const mailOptions = {
                from: `LivestockIQ <${process.env.EMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                html: htmlContent,
                attachments: options.attachments,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${options.to}: ${info.response}`);

            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };

        } catch (error) {
            lastError = error;
            console.error(`❌ Email send attempt ${attempt}/${maxRetries} failed:`, error.message);

            if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`   ⏳ Retrying in ${waitTime / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    // All retries failed
    console.error(`❌ Email send failed after ${maxRetries} attempts to ${options.to}`);
    return {
        success: false,
        error: lastError.message
    };
};

/**
 * Send bulk emails with rate limiting to avoid Gmail limits
 * @param {Array} emailOptionsArray - Array of email options objects
 * @param {number} delayBetweenEmails - Delay in ms between emails (default: 1000)
 */
export const sendBulkEmails = async (emailOptionsArray, delayBetweenEmails = 1000) => {
    const results = [];

    for (const [index, emailOptions] of emailOptionsArray.entries()) {
        console.log(`📧 Sending bulk email ${index + 1}/${emailOptionsArray.length}`);

        const result = await sendEmail(emailOptions);
        results.push({
            to: emailOptions.to,
            ...result
        });

        // Delay to avoid rate limits (Gmail: 500 emails/day, ~1 per 2 minutes safe)
        if (index < emailOptionsArray.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenEmails));
        }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Bulk email results: ${successCount}/${results.length} successful`);

    return results;
};

export default sendEmail;