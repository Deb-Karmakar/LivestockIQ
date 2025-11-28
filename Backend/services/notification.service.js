// Backend/services/notification.service.js

import sendEmail from '../utils/sendEmail.js';
import Treatment from '../models/treatment.model.js';
import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';
import Veterinarian from '../models/vet.model.js';
import LabTest from '../models/labTest.model.js';
import { differenceInDays, format } from 'date-fns';

/**
 * Unified Notification Service
 * Handles email notifications for withdrawal periods, MRL violations, and summaries
 */

/**
 * Send withdrawal period alert email
 * @param {string} farmerId - Farmer's MongoDB ID
 * @param {string} animalId - Animal tag ID
 * @param {Object} treatment - Treatment object
 */
export const sendWithdrawalAlert = async (farmerId, animalId, treatment) => {
    try {
        // Get farmer details
        const farmer = await Farmer.findById(farmerId);
        if (!farmer || !farmer.email) {
            console.log(`⚠️ Farmer ${farmerId} has no email address`);
            return { success: false, reason: 'No email address' };
        }

        // Get animal details
        const animal = await Animal.findOne({ tagId: animalId, farmerId });
        if (!animal) {
            console.log(`⚠️ Animal ${animalId} not found`);
            return { success: false, reason: 'Animal not found' };
        }

        // Calculate days remaining
        const now = new Date();
        const daysRemaining = differenceInDays(new Date(treatment.withdrawalEndDate), now);

        // Prepare template data
        const templateData = {
            farmerName: farmer.farmOwner || 'Farmer',
            animalId: animal.tagId,
            animalName: animal.name || `Animal ${animal.tagId}`,
            drugName: treatment.drugName,
            treatmentStartDate: format(new Date(treatment.startDate), 'dd MMM yyyy'),
            withdrawalEndDate: format(new Date(treatment.withdrawalEndDate), 'dd MMM yyyy'),
            daysRemaining: daysRemaining,
            portalLink: process.env.FRONTEND_URL || 'http://localhost:5173/farmer/alerts'
        };

        // Determine urgency for subject line
        let urgencyPrefix = '';
        if (daysRemaining <= 0) {
            urgencyPrefix = '✅ COMPLETED: ';
        } else if (daysRemaining <= 2) {
            urgencyPrefix = '🚨 URGENT: ';
        } else {
            urgencyPrefix = '⏰ REMINDER: ';
        }

        const result = await sendEmail({
            to: farmer.email,
            subject: `${urgencyPrefix}Withdrawal Period Alert - ${animal.name}`,
            template: 'withdrawalAlert',
            templateData,
            retries: 3
        });

        if (result.success) {
            console.log(`✅ Withdrawal alert sent to ${farmer.email} for animal ${animalId}`);
        }

        return result;

    } catch (error) {
        console.error('❌ Error sending withdrawal alert:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send MRL violation alert email
 * @param {string} farmerId - Farmer's MongoDB ID
 * @param {Object} labTest - Lab test result object
 */
export const sendMRLViolationAlert = async (farmerId, labTest) => {
    try {
        // Get farmer details
        const farmer = await Farmer.findById(farmerId);
        if (!farmer || !farmer.email) {
            return { success: false, reason: 'No email address' };
        }

        // Get animal details
        const animal = await Animal.findOne({ tagId: labTest.animalId, farmerId });

        // Get vet details if treatment is linked
        let vetInfo = { name: 'Your Veterinarian', phone: 'Contact through portal' };
        if (labTest.treatmentId) {
            const treatment = await Treatment.findById(labTest.treatmentId);
            if (treatment && treatment.vetId) {
                const vet = await Veterinarian.findOne({ vetId: treatment.vetId });
                if (vet) {
                    vetInfo = {
                        name: vet.fullName,
                        phone: vet.phoneNumber || 'Contact through portal'
                    };
                }
            }
        }

        // Calculate violation metrics
        const exceededBy = labTest.residueLevelDetected - labTest.mrlThreshold;
        const percentageOver = ((exceededBy / labTest.mrlThreshold) * 100).toFixed(1);

        // Calculate recommended extension (rough estimate: 3-7 days based on severity)
        const recommendedExtension = percentageOver > 50 ? 7 : percentageOver > 20 ? 5 : 3;

        const templateData = {
            farmerName: farmer.farmOwner || 'Farmer',
            animalId: labTest.animalId,
            animalName: animal?.name || `Animal ${labTest.animalId}`,
            drugName: labTest.drugName,
            sampleType: labTest.sampleType,
            productType: labTest.productType,
            testDate: format(new Date(labTest.testDate), 'dd MMM yyyy'),
            labName: labTest.labName,
            residueLevel: labTest.residueLevelDetected,
            mrlLimit: labTest.mrlThreshold,
            unit: labTest.unit,
            exceededBy: exceededBy.toFixed(2),
            percentageOver,
            regulatoryAuthority: 'FSSAI',
            vetName: vetInfo.name,
            vetPhone: vetInfo.phone,
            recommendedExtension,
            testReportNumber: labTest.testReportNumber,
            alertDate: format(new Date(), 'dd MMM yyyy, HH:mm'),
            portalLink: process.env.FRONTEND_URL || 'http://localhost:5173/farmer/alerts'
        };

        const result = await sendEmail({
            to: farmer.email,
            subject: `🚨 CRITICAL: MRL Violation Detected - ${animal?.name || labTest.animalId}`,
            template: 'mrlViolation',
            templateData,
            retries: 3
        });

        // Also notify the veterinarian if available
        if (vetInfo.name !== 'Your Veterinarian') {
            const vet = await Veterinarian.findOne({ fullName: vetInfo.name });
            if (vet && vet.email) {
                await sendEmail({
                    to: vet.email,
                    subject: `⚠️ MRL Violation Alert - Farmer: ${farmer.farmOwner}`,
                    template: 'mrlViolation',
                    templateData: {
                        ...templateData,
                        farmerName: `Dr. ${vet.fullName}` // Address vet appropriately
                    },
                    retries: 2
                });
                console.log(`📧 MRL violation alert also sent to veterinarian ${vet.email}`);
            }
        }

        if (result.success) {
            console.log(`✅ MRL violation alert sent to ${farmer.email}`);
        }

        return result;

    } catch (error) {
        console.error('❌ Error sending MRL violation alert:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send weekly farm summary email
 * @param {string} farmerId - Farmer's MongoDB ID
 */
export const sendWeeklySummary = async (farmerId) => {
    try {
        const farmer = await Farmer.findById(farmerId);
        if (!farmer || !farmer.email) {
            return { success: false, reason: 'No email address' };
        }

        // Get current week start/end dates
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);

        // Gather statistics
        const totalAnimals = await Animal.countDocuments({ farmerId, status: 'Active' });

        const treatmentsThisWeek = await Treatment.countDocuments({
            farmerId,
            createdAt: { $gte: weekStart }
        });

        const treatmentsLastWeek = await Treatment.countDocuments({
            farmerId,
            createdAt: { $gte: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000), $lt: weekStart }
        });

        // Animals under withdrawal
        const animalsUnderWithdrawal = await Treatment.countDocuments({
            farmerId,
            status: 'Approved',
            withdrawalEndDate: { $gt: now }
        });

        // Safe to sell (active animals - animals under withdrawal)
        const safeToSell = totalAnimals - animalsUnderWithdrawal;

        // Upcoming withdrawal completions (next 7 days)
        const upcomingWithdrawalTreatments = await Treatment.find({
            farmerId,
            status: 'Approved',
            withdrawalEndDate: {
                $gte: now,
                $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            }
        }).populate('animalId');

        const upcomingWithdrawals = await Promise.all(
            upcomingWithdrawalTreatments.map(async (treatment) => {
                const animal = await Animal.findOne({ tagId: treatment.animalId });
                return {
                    animalName: animal?.name || treatment.animalId,
                    daysRemaining: differenceInDays(new Date(treatment.withdrawalEndDate), now)
                };
            })
        );

        // AMU trend
        const amuChange = treatmentsLastWeek > 0
            ? (((treatmentsThisWeek - treatmentsLastWeek) / treatmentsLastWeek) * 100).toFixed(1)
            : 0;

        // Action items
        const actionItems = [];
        if (upcomingWithdrawals.length > 0) {
            actionItems.push(`${upcomingWithdrawals.length} animal(s) completing withdrawal this week - prepare for MRL testing`);
        }
        if (treatmentsThisWeek > treatmentsLastWeek * 1.5) {
            actionItems.push('⚠️ High AMU this week - review treatment protocols with veterinarian');
        }
        if (animalsUnderWithdrawal > totalAnimals * 0.3) {
            actionItems.push(`${animalsUnderWithdrawal} animals under withdrawal - plan production accordingly`);
        }
        if (safeToSell === totalAnimals) {
            actionItems.push('✅ All animals safe for sale - no active withdrawal periods');
        }

        const templateData = {
            farmerName: farmer.farmOwner || 'Farmer',
            weekRange: `${format(weekStart, 'dd MMM')} - ${format(now, 'dd MMM yyyy')}`,
            totalAnimals,
            treatmentsThisWeek,
            animalsUnderWithdrawal,
            safeToSell,
            upcomingWithdrawals,
            amuTrend: {
                thisWeek: treatmentsThisWeek,
                lastWeek: treatmentsLastWeek,
                change: parseFloat(amuChange)
            },
            actionItems
        };

        const result = await sendEmail({
            to: farmer.email,
            subject: `📊 Weekly Farm Summary - ${format(now, 'dd MMM yyyy')}`,
            template: 'weeklySummary',
            templateData,
            retries: 3
        });

        if (result.success) {
            console.log(`✅ Weekly summary sent to ${farmer.email}`);
        }

        return result;

    } catch (error) {
        console.error('❌ Error sending weekly summary:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send test email to verify email configuration
 * @param {string} recipientEmail - Email address to send test to
 */
export const sendTestEmail = async (recipientEmail) => {
    try {
        const result = await sendEmail({
            to: recipientEmail,
            subject: '✅ LivestockIQ Email Test',
            html: `
                <div style="font-family: Arial; padding: 20px; background: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                        <h1 style="color: #10b981;">✅ Email Configuration Working!</h1>
                        <p>This is a test email from LivestockIQ notification system.</p>
                        <p>If you received this, your email configuration is correct.</p>
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            Sent at: ${format(new Date(), 'dd MMM yyyy, HH:mm:ss')}
                        </p>
                    </div>
                </div>
            `,
            retries: 1
        });

        return result;
    } catch (error) {
        console.error('❌ Test email failed:', error);
        return { success: false, error: error.message };
    }
};
