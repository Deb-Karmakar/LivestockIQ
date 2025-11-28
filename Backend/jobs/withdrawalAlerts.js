// Backend/jobs/withdrawalAlerts.js

import cron from 'node-cron';
import Treatment from '../models/treatment.model.js';
import Farmer from '../models/farmer.model.js';
import { sendWithdrawalAlert } from '../services/notification.service.js';
import { differenceInDays } from 'date-fns';

/**
 * Automated Withdrawal Period Alert Job
 * Runs daily at 8:00 AM to check for treatments nearing withdrawal completion
 * Sends email alerts at 7, 3, and 1 day marks
 */

const checkWithdrawalPeriods = async () => {
    try {
        console.log('\n🔍 [Withdrawal Alerts] Starting daily withdrawal period check...');
        const now = new Date();

        // Find all approved treatments with future withdrawal dates
        const activeWithdrawals = await Treatment.find({
            status: 'Approved',
            withdrawalEndDate: { $gte: now }
        });

        console.log(`   Found ${activeWithdrawals.length} active withdrawal periods`);

        const alertThresholds = [7, 3, 1, 0]; // Days before/on withdrawal end
        let emailsSent = 0;
        let emailsFailed = 0;

        for (const treatment of activeWithdrawals) {
            const daysRemaining = differenceInDays(new Date(treatment.withdrawalEndDate), now);

            // Check if we should send an alert for this treatment
            const shouldAlert = alertThresholds.includes(daysRemaining);

            if (shouldAlert) {
                console.log(`   📧 Sending alert for animal ${treatment.animalId} - ${daysRemaining} days remaining`);

                const result = await sendWithdrawalAlert(
                    treatment.farmerId,
                    treatment.animalId,
                    treatment
                );

                if (result.success) {
                    emailsSent++;
                } else {
                    emailsFailed++;
                    console.log(`   ❌ Failed to send alert: ${result.reason || result.error}`);
                }

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`✅ [Withdrawal Alerts] Check complete: ${emailsSent} emails sent, ${emailsFailed} failed`);

    } catch (error) {
        console.error('❌ [Withdrawal Alerts] Error in withdrawal period check:', error);
    }
};

/**
 * Start the withdrawal period alert job
 * Runs every day at 8:00 AM
 */
export const startWithdrawalAlertJob = () => {
    // Schedule: Every day at 8:00 AM (0 8 * * *)
    cron.schedule('0 8 * * *', () => {
        console.log('\n⏰ [CRON] Withdrawal alert job triggered at', new Date().toLocaleString());
        checkWithdrawalPeriods();
    });

    console.log('✅ Withdrawal period alert job scheduled (Daily at 8:00 AM)');

    // Run immediately on startup for testing (comment out in production)
    // checkWithdrawalPeriods();
};

// Export for manual testing
export { checkWithdrawalPeriods };
