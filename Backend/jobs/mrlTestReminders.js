// Backend/jobs/mrlTestReminders.js

import cron from 'node-cron';
import Treatment from '../models/treatment.model.js';
import LabTest from '../models/labTest.model.js';
import Animal from '../models/animal.model.js';
import Farmer from '../models/farmer.model.js';
import sendEmail from '../utils/sendEmail.js';
import { differenceInDays, format } from 'date-fns';

/**
 * Automated MRL Test Reminder Job
 * Runs daily at 10:00 AM
 * Reminds farmers to conduct MRL testing for animals that completed withdrawal
 */

const checkOverdueMRLTests = async () => {
    try {
        console.log('\n🧪 [MRL Reminders] Starting overdue MRL test check...');
        const now = new Date();

        // Find treatments where withdrawal period ended but no MRL test exists
        const completedWithdrawals = await Treatment.find({
            status: 'Approved',
            withdrawalEndDate: { $lt: now }, // Withdrawal period completed
            requiresMrlTest: true,
            mrlCompliant: null // No MRL test result yet
        });

        console.log(`   Found ${completedWithdrawals.length} treatments needing MRL testing`);

        // Group by farmer and animal for consolidated reminders
        const remindersByFarmer = new Map();

        for (const treatment of completedWithdrawals) {
            const daysSinceWithdrawal = differenceInDays(now, new Date(treatment.withdrawalEndDate));

            // Only remind if 1+ days have passed since withdrawal ended
            if (daysSinceWithdrawal >= 1) {
                // Check if MRL test exists for this animal/drug combination
                const recentTest = await LabTest.findOne({
                    farmerId: treatment.farmerId,
                    animalId: treatment.animalId,
                    drugName: treatment.drugName,
                    testDate: { $gte: treatment.withdrawalEndDate }
                });

                // Skip if test already exists
                if (recentTest) {
                    continue;
                }

                // Get animal details
                const animal = await Animal.findOne({
                    tagId: treatment.animalId,
                    farmerId: treatment.farmerId
                });

                if (!animal) continue;

                // Group by farmer
                const farmerId = treatment.farmerId.toString();
                if (!remindersByFarmer.has(farmerId)) {
                    remindersByFarmer.set(farmerId, []);
                }

                remindersByFarmer.get(farmerId).push({
                    animalId: treatment.animalId,
                    animalName: animal.name || treatment.animalId,
                    drugName: treatment.drugName,
                    withdrawalEndDate: treatment.withdrawalEndDate,
                    daysSince: daysSinceWithdrawal,
                    urgency: daysSinceWithdrawal > 7 ? 'HIGH' : daysSinceWithdrawal > 3 ? 'MEDIUM' : 'NORMAL'
                });
            }
        }

        console.log(`   ${remindersByFarmer.size} farmers need MRL test reminders`);

        // Send consolidated reminder emails
        let emailsSent = 0;

        for (const [farmerId, animals] of remindersByFarmer) {
            const farmer = await Farmer.findById(farmerId);
            if (!farmer || !farmer.email) {
                continue;
            }

            // Determine overall urgency
            const hasHighUrgency = animals.some(a => a.urgency === 'HIGH');
            const urgencyPrefix = hasHighUrgency ? '🚨 URGENT' : '⏰ REMINDER';

            // Build HTML email content
            const animalsList = animals.map(a => `
                <div style="background: #f9fafb; padding: 15px; margin: 10px 0; border-left: 4px solid ${a.urgency === 'HIGH' ? '#dc2626' : a.urgency === 'MEDIUM' ? '#f59e0b' : '#10b981'
                }; border-radius: 5px;">
                    <strong>${a.animalName}</strong> (${a.animalId})<br>
                    Drug: ${a.drugName}<br>
                    Withdrawal ended: ${format(new Date(a.withdrawalEndDate), 'dd MMM yyyy')} 
                    (${a.daysSince} days ago)
                </div>
            `).join('');

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
                        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center; }
                        .content { padding: 30px 20px; }
                        .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🧪 MRL Testing Required</h1>
                            <p>${urgencyPrefix}: Animals Need Testing</p>
                        </div>
                        <div class="content">
                            <p>Dear ${farmer.farmOwner || 'Farmer'},</p>
                            <p style="margin: 20px 0;">The following animals have completed their withdrawal periods and require MRL testing before products can be sold:</p>
                            ${animalsList}
                            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                                <strong>⚠️ Action Required:</strong>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    <li>Contact a certified laboratory for MRL testing</li>
                                    <li>Collect milk/meat samples from listed animals</li>
                                    <li>Upload test results to LivestockIQ portal</li>
                                    <li>Do NOT sell products until test results are uploaded and verified</li>
                                </ul>
                            </div>
                            <div style="text-align: center;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/farmer/mrl-compliance" class="button">
                                    Upload Test Results
                                </a>
                            </div>
                        </div>
                        <div class="footer">
                            <p><strong>LivestockIQ</strong> - MRL Compliance System</p>
                            <p>This is an automated reminder. Do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const result = await sendEmail({
                to: farmer.email,
                subject: `${urgencyPrefix}: MRL Testing Required for ${animals.length} Animal(s)`,
                html: htmlContent,
                retries: 2
            });

            if (result.success) {
                emailsSent++;
                console.log(`   ✅ Sent reminder to ${farmer.email} for ${animals.length} animals`);
            } else {
                console.log(`   ❌ Failed to send to ${farmer.email}`);
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`✅ [MRL Reminders] Complete: ${emailsSent} reminder emails sent`);

    } catch (error) {
        console.error('❌ [MRL Reminders] Error in MRL test reminder job:', error);
    }
};

/**
 * Start the MRL test reminder job
 * Runs every day at 10:00 AM (0 10 * * *)
 */
export const startMRLTestReminderJob = () => {
    // Schedule: Every day at 10:00 AM
    cron.schedule('0 10 * * *', () => {
        console.log('\n⏰ [CRON] MRL test reminder job triggered at', new Date().toLocaleString());
        checkOverdueMRLTests();
    });

    console.log('✅ MRL test reminder job scheduled (Daily at 10:00 AM)');
};

// Export for manual testing
export { checkOverdueMRLTests };
