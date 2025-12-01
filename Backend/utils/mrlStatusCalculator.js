// Backend/utils/mrlStatusCalculator.js

import Treatment from '../models/treatment.model.js';
import LabTest from '../models/labTest.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';

/**
 * Calculate MRL status for an animal
 * @param {Object} animal - Animal document
 * @param {String} farmerId - Farmer ID
 * @returns {Object} - { mrlStatus, statusMessage, canSellProducts }
 */
export const calculateAnimalMRLStatus = async (animal, farmerId) => {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Get recent treatments
        const recentTreatments = await Treatment.find({
            animalId: animal.tagId,
            farmerId,
            status: 'Approved',
            startDate: { $gte: ninetyDaysAgo }
        }).sort({ startDate: -1 });

        // Get all lab tests
        const labTests = await LabTest.find({
            animalId: animal.tagId,
            farmerId,
            testDate: { $gte: ninetyDaysAgo }
        }).sort({ testDate: -1 });

        // For NEW tag check, we need to check if animal has EVER had treatments or feed
        // (not just recent ones), to ensure truly new animals without any history
        const allTreatments = await Treatment.find({
            animalId: animal.tagId,
            farmerId,
            status: 'Approved'
        });
        const hasTreatments = recentTreatments.length > 0;
        const hasAnyTreatmentHistory = allTreatments.length > 0;

        const feedAdministrations = await FeedAdministration.find({
            animalIds: animal.tagId,
            farmerId
        });
        const hasFeedAdministrations = feedAdministrations.length > 0;

        // Initialize result variables
        let mrlStatus = 'SAFE';
        let statusMessage = 'No recent treatments or all MRL tests passed';
        let canSellProducts = true;

        // If animal is new and hasn't received ANY treatments or feed EVER, show "NEW" tag
        if (animal.isNew && !hasAnyTreatmentHistory && !hasFeedAdministrations) {
            mrlStatus = 'NEW';
            statusMessage = 'Newly added animal - no treatments yet';
            canSellProducts = true;
        } else {
            // Calculate MRL status

            // Check MRL test results
            if (labTests.length > 0) {
                const latestTest = labTests[0];

                if (!latestTest.isPassed) {
                    if (latestTest.violationResolved) {
                        mrlStatus = 'TEST_REQUIRED';
                        statusMessage = 'Previous violation resolved - new MRL test required';
                        canSellProducts = false;
                    } else {
                        mrlStatus = 'VIOLATION';
                        statusMessage = 'MRL violation detected - products cannot be sold';
                        canSellProducts = false;
                    }
                } else if (latestTest.isPassed) {
                    if (latestTest.status === 'Rejected' && latestTest.regulatorApproved === false) {
                        mrlStatus = 'TEST_REQUIRED';
                        statusMessage = 'Previous test rejected by regulator - new MRL test required';
                        canSellProducts = false;
                    } else if (latestTest.regulatorApproved) {
                        mrlStatus = 'SAFE';
                        statusMessage = 'MRL compliant - regulator verified';
                        canSellProducts = true;
                    } else {
                        mrlStatus = 'PENDING_VERIFICATION';
                        statusMessage = 'Latest MRL test passed system check - awaiting regulator verification';
                        canSellProducts = false;
                    }
                }
            }

            // Check for treatments needing tests
            const treatmentsNeedingTest = recentTreatments.filter(t => {
                const withinWithdrawal = t.withdrawalEndDate && new Date() < new Date(t.withdrawalEndDate);
                const hasTestAfterWithdrawal = labTests.some(test =>
                    new Date(test.testDate) > new Date(t.withdrawalEndDate || t.startDate)
                );
                return !withinWithdrawal && !hasTestAfterWithdrawal && t.requiresMrlTest;
            });
            // Check for feed administrations needing tests (only approved ones)
            const feedNeedingTest = feedAdministrations.filter(f => {
                // Only consider approved feed administrations
                if (f.status !== 'Active') return false;
                const withinWithdrawal = f.withdrawalEndDate && new Date() < new Date(f.withdrawalEndDate);
                const hasTestAfterWithdrawal = labTests.some(test =>
                    new Date(test.testDate) > new Date(f.withdrawalEndDate || f.startDate)
                );
                return !withinWithdrawal && !hasTestAfterWithdrawal && f.requiresMrlTest;
            });
            if (treatmentsNeedingTest.length > 0 || feedNeedingTest.length > 0) {
                mrlStatus = 'TEST_REQUIRED';
                statusMessage = 'MRL testing required before product sale';
                canSellProducts = false;
            }
            // Check active withdrawal periods from treatments
            const activeWithdrawalTreatment = recentTreatments.find(t =>
                t.withdrawalEndDate && new Date() < new Date(t.withdrawalEndDate)
            );
            // Check active withdrawal periods from approved feed administrations
            const activeWithdrawalFeed = feedAdministrations.find(f =>
                f.status === 'Active' && f.withdrawalEndDate && new Date() < new Date(f.withdrawalEndDate)
            );
            const activeWithdrawal = activeWithdrawalTreatment || activeWithdrawalFeed;
            if (activeWithdrawal && mrlStatus !== 'VIOLATION') {
                mrlStatus = 'WITHDRAWAL_ACTIVE';
                const withdrawalEndDate = new Date(activeWithdrawal.withdrawalEndDate).toLocaleDateString();
                const source = activeWithdrawalTreatment ? 'treatment' : 'feed medication';
                statusMessage = `Withdrawal period active until ${withdrawalEndDate} (from ${source})`;
                canSellProducts = false;
            }
        }

        // NEW: Persist status to DB if changed
        if (animal && typeof animal.save === 'function') {
            if (animal.mrlStatus !== mrlStatus) {
                // console.log(`Persisting MRL Status change for ${animal.tagId}: ${animal.mrlStatus} -> ${mrlStatus}`);
                animal.mrlStatus = mrlStatus;
                // We don't await here to avoid blocking the response significantly, 
                // but we catch errors to prevent crashes.
                // Actually, for consistency, we should await.
                await animal.save().catch(err => console.error("Error saving animal status:", err));
            }
        }

        return { mrlStatus, statusMessage, canSellProducts };
    } catch (error) {
        console.error('Error calculating MRL status:', error);
        return { mrlStatus: 'UNKNOWN', statusMessage: 'Error calculating status', canSellProducts: false };
    }
};