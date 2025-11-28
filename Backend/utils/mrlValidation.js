// Backend/utils/mrlValidation.js

import Treatment from '../models/treatment.model.js';
import LabTest from '../models/labTest.model.js';
import { differenceInDays } from 'date-fns';

/**
 * MRL Compliance Validation Utilities
 * Comprehensive checks before allowing product sales
 */

/**
 * Check if animal is safe to sell products from
 * @param {string} animalId - Animal tag ID
 * @param {string} farmerId - Farmer's MongoDB ID
 * @param {string} productType - 'Milk', 'Meat', 'Eggs', etc.
 * @returns {Object} { canSell: boolean, reason: string, details: object }
 */
export const validateMRLCompliance = async (animalId, farmerId, productType = 'Milk') => {
    try {
        const now = new Date();

        // 1. CHECK ACTIVE WITHDRAWAL PERIODS
        const activeWithdrawal = await Treatment.findOne({
            animalId,
            farmerId,
            status: 'Approved',
            withdrawalEndDate: { $gt: now }
        }).sort({ withdrawalEndDate: -1 });

        if (activeWithdrawal) {
            const daysRemaining = differenceInDays(new Date(activeWithdrawal.withdrawalEndDate), now);
            return {
                canSell: false,
                reason: 'ACTIVE_WITHDRAWAL',
                message: `Animal is still within withdrawal period`,
                details: {
                    drugName: activeWithdrawal.drugName,
                    withdrawalEndDate: activeWithdrawal.withdrawalEndDate,
                    daysRemaining: daysRemaining + 1,
                    treatmentId: activeWithdrawal._id
                }
            };
        }

        // 2. CHECK FOR RECENT TREATMENTS REQUIRING MRL TESTS
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentTreatments = await Treatment.find({
            animalId,
            farmerId,
            status: 'Approved',
            withdrawalEndDate: { $lte: now, $gte: thirtyDaysAgo },
            requiresMrlTest: true
        });

        if (recentTreatments.length > 0) {
            // Check if MRL tests exist for these treatments
            for (const treatment of recentTreatments) {
                // Check if treatment has MRL test results
                if (!treatment.mrlTestResults || treatment.mrlTestResults.length === 0) {
                    return {
                        canSell: false,
                        reason: 'MRL_TEST_REQUIRED',
                        message: `MRL testing required before sale`,
                        details: {
                            drugName: treatment.drugName,
                            withdrawalEndDate: treatment.withdrawalEndDate,
                            treatmentId: treatment._id,
                            daysSinceWithdrawal: differenceInDays(now, new Date(treatment.withdrawalEndDate))
                        }
                    };
                }

                // Check if MRL test passed
                if (treatment.mrlCompliant === false) {
                    return {
                        canSell: false,
                        reason: 'MRL_VIOLATION',
                        message: `MRL test failed - residue levels exceed safe limits`,
                        details: {
                            drugName: treatment.drugName,
                            treatmentId: treatment._id,
                            testDate: treatment.lastMrlTestDate
                        }
                    };
                }
            }
        }

        // 3. CHECK FOR RECENT FAILED LAB TESTS (last 30 days)
        const recentFailedTests = await LabTest.find({
            animalId,
            farmerId,
            productType,
            isPassed: false,
            testDate: { $gte: thirtyDaysAgo }
        }).sort({ testDate: -1 });

        if (recentFailedTests.length > 0) {
            const latestFailedTest = recentFailedTests[0];
            return {
                canSell: false,
                reason: 'MRL_VIOLATION',
                message: `Recent MRL test failed`,
                details: {
                    drugName: latestFailedTest.drugName,
                    testDate: latestFailedTest.testDate,
                    residueLevel: latestFailedTest.residueLevelDetected,
                    mrlLimit: latestFailedTest.mrlThreshold,
                    unit: latestFailedTest.unit,
                    testId: latestFailedTest._id
                }
            };
        }

        // 4. CHECK IF RECENT PASSED TESTS EXIST (validation that animal was tested)
        const recentPassedTests = await LabTest.find({
            animalId,
            farmerId,
            productType,
            isPassed: true,
            testDate: { $gte: thirtyDaysAgo }
        }).sort({ testDate: -1 });

        // If there were recent treatments but no recent passed tests, require testing
        if (recentTreatments.length > 0 && recentPassedTests.length === 0) {
            return {
                canSell: false,
                reason: 'MRL_TEST_REQUIRED',
                message: `MRL testing required after recent treatment`,
                details: {
                    recentTreatments: recentTreatments.length,
                    lastTreatmentDate: recentTreatments[0].createdAt
                }
            };
        }

        // 5. CHECK TEST RECENCY (tests older than 30 days require re-testing)
        if (recentPassedTests.length > 0) {
            const latestTest = recentPassedTests[0];
            const testAge = differenceInDays(now, new Date(latestTest.testDate));

            if (testAge > 30) {
                return {
                    canSell: false,
                    reason: 'MRL_TEST_EXPIRED',
                    message: `MRL test is too old, re-testing required`,
                    details: {
                        lastTestDate: latestTest.testDate,
                        testAge: testAge,
                        drugName: latestTest.drugName
                    }
                };
            }
        }

        // ALL CHECKS PASSED - SAFE TO SELL
        return {
            canSell: true,
            reason: 'COMPLIANT',
            message: 'Animal cleared for product sale',
            details: {
                hasRecentTests: recentPassedTests.length > 0,
                latestTestDate: recentPassedTests.length > 0 ? recentPassedTests[0].testDate : null,
                noActiveWithdrawals: true,
                noRecentViolations: true
            }
        };

    } catch (error) {
        console.error('Error in MRL validation:', error);
        return {
            canSell: false,
            reason: 'VALIDATION_ERROR',
            message: 'Error checking MRL compliance',
            details: { error: error.message }
        };
    }
};

/**
 * Get comprehensive MRL status for an animal
 * @param {string} animalId - Animal tag ID
 * @param {string} farmerId - Farmer's MongoDB ID
 * @returns {Object} Detailed MRL status object
 */
export const getAnimalMRLStatus = async (animalId, farmerId) => {
    const validation = await validateMRLCompliance(animalId, farmerId);

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get additional context
    const recentTreatments = await Treatment.find({
        animalId,
        farmerId,
        status: 'Approved',
        createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(5);

    const recentTests = await LabTest.find({
        animalId,
        farmerId,
        testDate: { $gte: thirtyDaysAgo }
    }).sort({ testDate: -1 }).limit(5);

    return {
        ...validation,
        statistics: {
            recentTreatments: recentTreatments.length,
            recentTests: recentTests.length,
            passedTests: recentTests.filter(t => t.isPassed).length,
            failedTests: recentTests.filter(t => !t.isPassed).length
        },
        recentActivity: {
            treatments: recentTreatments.map(t => ({
                drugName: t.drugName,
                date: t.createdAt,
                withdrawalEnd: t.withdrawalEndDate,
                mrlCompliant: t.mrlCompliant
            })),
            tests: recentTests.map(t => ({
                drugName: t.drugName,
                date: t.testDate,
                passed: t.isPassed,
                residueLevel: t.residueLevelDetected,
                limit: t.mrlThreshold
            }))
        }
    };
};

/**
 * Check multiple animals at once (for bulk sales)
 * @param {Array} animalIds - Array of animal tag IDs
 * @param {string} farmerId - Farmer's MongoDB ID
 * @param {string} productType - Product type
 * @returns {Object} { allCompliant: boolean, results: Array }
 */
export const validateBulkMRLCompliance = async (animalIds, farmerId, productType = 'Milk') => {
    const results = await Promise.all(
        animalIds.map(async (animalId) => {
            const validation = await validateMRLCompliance(animalId, farmerId, productType);
            return {
                animalId,
                ...validation
            };
        })
    );

    const allCompliant = results.every(r => r.canSell);
    const violations = results.filter(r => !r.canSell);

    return {
        allCompliant,
        totalAnimals: animalIds.length,
        compliantAnimals: results.filter(r => r.canSell).length,
        violations: violations.length,
        results,
        violationSummary: violations.map(v => ({
            animalId: v.animalId,
            reason: v.reason,
            message: v.message
        }))
    };
};
