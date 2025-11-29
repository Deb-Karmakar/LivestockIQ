// Backend/jobs/withdrawalStatusUpdater.job.js

import cron from 'node-cron';
import Animal from '../models/animal.model.js';
import Farmer from '../models/farmer.model.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * Scheduled job that runs daily at midnight to check for animals
 * whose withdrawal periods have ended and need MRL testing
 */
export const startWithdrawalStatusUpdater = () => {
    // Run every day at midnight (0 0 * * *)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('🔍 Running withdrawal status updater job...');
            const now = new Date();

            // Find animals with expired withdrawal periods
            const animals = await Animal.find({
                withdrawalActive: true,
                withdrawalEndDate: { $lte: now }
            });

            if (animals.length === 0) {
                console.log('✅ No animals to update');
                return;
            }

            // Group animals by farmer for batch email notifications
            const farmerAnimalsMap = new Map();

            for (const animal of animals) {
                // Update animal status
                animal.withdrawalActive = false;
                animal.requiresMrlTest = true;
                await animal.save();

                // Group by farmer
                const farmerId = animal.farmerId.toString();
                if (!farmerAnimalsMap.has(farmerId)) {
                    farmerAnimalsMap.set(farmerId, []);
                }
                farmerAnimalsMap.get(farmerId).push(animal.tagId);
            }

            // Send email notifications to farmers
            for (const [farmerId, animalTagIds] of farmerAnimalsMap) {
                try {
                    const farmer = await Farmer.findById(farmerId);
                    if (farmer && farmer.email) {
                        await sendEmail({
                            to: farmer.email,
                            subject: 'MRL Testing Required for Animals',
                            html: `
                                <h2>MRL Testing Required</h2>
                                <p>Dear ${farmer.farmOwner},</p>
                                <p>The withdrawal period has ended for the following animal(s):</p>
                                <ul>
                                    ${animalTagIds.map(tagId => `<li>Animal ${tagId}</li>`).join('')}
                                </ul>
                                <p><strong>Action Required:</strong> Please upload MRL lab test results for these animals in the LivestockIQ system.</p>
                                <p>These animals cannot be sold or slaughtered until MRL tests are completed and approved by a regulator.</p>
                                <br>
                                <p>Best regards,<br>LivestockIQ Team</p>
                            `
                        });
                    }
                } catch (emailError) {
                    console.error(`❌ Error sending email to farmer ${farmerId}:`, emailError);
                }
            }

            console.log(`✅ Updated ${animals.length} animal(s) - withdrawal ended, MRL test required`);
            console.log(`📧 Sent notifications to ${farmerAnimalsMap.size} farmer(s)`);

        } catch (error) {
            console.error('❌ Error in withdrawal status updater job:', error);
        }
    });

    console.log('✅ Withdrawal status updater job scheduled (daily at midnight)');
};
