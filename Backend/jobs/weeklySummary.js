// Backend/jobs/weeklySummary.js

import cron from 'node-cron';
import Farmer from '../models/farmer.model.js';
import { sendWeeklySummary } from '../services/notification.service.js';
import { sendBulkEmails } from '../utils/sendEmail.js';

/**
 * Automated Weekly Summary Job
 * Runs every Sunday at 6:00 PM
 * Sends farm health summary to all active farmers
 */

const sendWeeklySummaries = async () => {
    try {
        console.log('\n📊 [Weekly Summary] Starting weekly summary generation...');

        // Get all farmers with email addresses
        const farmers = await Farmer.find({
            email: { $exists: true, $ne: null, $ne: '' }
        });

        console.log(`   Found ${farmers.length} farmers with email addresses`);

        let successCount = 0;
        let failCount = 0;

        // Send summaries with rate limiting (2 seconds between emails)
        for (const farmer of farmers) {
            console.log(`   📧 Sending weekly summary to ${farmer.farmOwner} (${farmer.email})`);

            const result = await sendWeeklySummary(farmer._id);

            if (result.success) {
                successCount++;
            } else {
                failCount++;
                console.log(`   ❌ Failed: ${result.reason || result.error}`);
            }

            // Rate limiting: 2 seconds between emails (safe for Gmail limits)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`✅ [Weekly Summary] Complete: ${successCount} sent, ${failCount} failed`);

    } catch (error) {
        console.error('❌ [Weekly Summary] Error in weekly summary job:', error);
    }
};

/**
 * Start the weekly summary job
 * Runs every Sunday at 6:00 PM (0 18 * * 0)
 */
export const startWeeklySummaryJob = () => {
    // Schedule: Every Sunday at 6:00 PM
    cron.schedule('0 18 * * 0', () => {
        console.log('\n⏰ [CRON] Weekly summary job triggered at', new Date().toLocaleString());
        sendWeeklySummaries();
    });

    console.log('✅ Weekly summary job scheduled (Every Sunday at 6:00 PM)');

    // For testing: Run on first Monday of month at 6 PM (optional)
    // cron.schedule('0 18 1-7 * 1', sendWeeklySummaries);
};

// Export for manual testing
export { sendWeeklySummaries };
