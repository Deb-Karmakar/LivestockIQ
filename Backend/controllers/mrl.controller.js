// Backend/controllers/mrl.controller.js

import MRL from '../models/mrl.model.js';
import LabTest from '../models/labTest.model.js';
import Treatment from '../models/treatment.model.js';
import Animal from '../models/animal.model.js';
import { sendMRLViolationAlert } from '../services/notification.service.js';
import { sendMRLViolationAlert as sendMRLViolationWebSocket, sendLabTestResultAlert } from '../services/websocket.service.js';
import { alertMRLViolation, checkCompliancePatterns } from '../services/regulator.service.js';

// @desc    Get all MRL limits (with optional filtering)
// @route   GET /api/mrl/limits
// @access  Public (for reference)
export const getMRLLimits = async (req, res) => {
    try {
        const { drugName, species, productType } = req.query;

        let query = { isActive: true };

        if (drugName) {
            query.drugName = new RegExp(drugName, 'i');
        }
        if (species) {
            query.species = species;
        }
        if (productType) {
            query.productType = productType;
        }

        const limits = await MRL.find(query).sort({ drugName: 1, species: 1, productType: 1 });

        res.json({
            count: limits.length,
            data: limits
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get MRL limit for specific drug/species/product combination
// @route   GET /api/mrl/lookup
// @access  Public
export const lookupMRL = async (req, res) => {
    try {
        const { drugName, species, productType } = req.query;

        if (!drugName || !species || !productType) {
            return res.status(400).json({
                message: 'Please provide drugName, species, and productType'
            });
        }

        const mrl = await MRL.findMRLLimit(drugName, species, productType);

        if (!mrl) {
            return res.status(404).json({
                message: 'No MRL limit found for this combination',
                suggestion: 'Check drug name spelling or consult with veterinarian'
            });
        }

        res.json(mrl);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Submit lab test result
// @route   POST /api/mrl/test-result
// @access  Private (Farmer)
export const submitLabTest = async (req, res) => {
    try {
        const farmerId = req.user._id;
        const {
            animalId,
            treatmentId,
            drugName,
            sampleType,
            productType,
            residueLevelDetected,
            unit,
            testDate,
            labName,
            labLocation,
            labCertificationNumber,
            testReportNumber,
            certificateUrl,
            testedBy,
            notes
        } = req.body;

        // Validate required fields
        if (!animalId || !drugName || !sampleType || !productType || !residueLevelDetected || !testDate || !labName || !testReportNumber) {
            return res.status(400).json({
                message: 'Please provide all required fields'
            });
        }

        // Verify animal belongs to this farmer
        const animal = await Animal.findOne({ tagId: animalId, farmerId });
        if (!animal) {
            return res.status(404).json({
                message: 'Animal not found or does not belong to you'
            });
        }

        // Get MRL threshold for this drug/product combination
        const mrlData = await MRL.findMRLLimit(drugName, animal.species, productType);

        if (!mrlData) {
            return res.status(400).json({
                message: 'MRL limit not found for this drug/product combination. Please contact administrator.'
            });
        }

        const mrlThreshold = mrlData.mrlLimit;
        const isPassed = residueLevelDetected <= mrlThreshold;

        // Create lab test record
        const labTest = await LabTest.create({
            farmerId,
            animalId,
            treatmentId: treatmentId || undefined,
            drugName,
            sampleType,
            productType,
            residueLevelDetected,
            unit: unit || 'µg/kg',
            mrlThreshold,
            testDate,
            labName,
            labLocation,
            labCertificationNumber,
            testReportNumber,
            certificateUrl,
            isPassed,
            testedBy,
            notes,
            status: 'Pending Verification'
        });

        // Update treatment if linked
        if (treatmentId) {
            await Treatment.findByIdAndUpdate(treatmentId, {
                mrlCompliant: isPassed,
                lastMrlTestDate: testDate,
                $push: { mrlTestResults: labTest._id }
            });
        }

        // 🔔 SEND EMAIL ALERT IF MRL VIOLATION
        if (!isPassed) {
            console.log('⚠️ MRL Violation detected - sending email alert...');
            const emailResult = await sendMRLViolationAlert(farmerId, labTest);
            if (emailResult.success) {
                console.log('✅ MRL violation email sent successfully');
            }

            // 📡 SEND WEBSOCKET ALERT
            sendMRLViolationWebSocket(farmerId.toString(), {
                animalId: labTest.animalId,
                animalName: animal?.name || labTest.animalId,
                drugName: labTest.drugName,
                residueLevel: labTest.residueLevelDetected,
                mrlLimit: labTest.mrlThreshold,
                exceededBy: (labTest.residueLevelDetected - labTest.mrlThreshold).toFixed(2)
            });

            // 🚨 ALERT REGULATORS
            await alertMRLViolation(farmerId, {
                animalId: labTest.animalId,
                animalName: animal?.name || labTest.animalId,
                drugName: labTest.drugName,
                residueLevel: labTest.residueLevelDetected,
                mrlLimit: labTest.mrlThreshold,
                productType: labTest.productType,
                labTestId: labTest._id
            });

            // Check for compliance patterns
            checkCompliancePatterns(farmerId).catch(err =>
                console.error('Error checking compliance patterns:', err)
            );
        } else {
            // Send success notification via WebSocket
            sendLabTestResultAlert(farmerId.toString(), {
                testId: labTest._id.toString(),
                animalId: labTest.animalId,
                animalName: animal?.name || labTest.animalId,
                drugName: labTest.drugName,
                isPassed: true,
                residueLevel: labTest.residueLevelDetected,
                mrlLimit: labTest.mrlThreshold
            });
        }

        res.status(201).json({
            message: isPassed
                ? 'Lab test submitted successfully. MRL test PASSED! ✅'
                : 'Lab test submitted. WARNING: MRL limit EXCEEDED! ⚠️ Email alert sent.',
            labTest,
            mrlThreshold,
            isPassed,
            actionRequired: !isPassed ? 'Do not sell products from this animal until further notice' : null,
            emailSent: !isPassed
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get MRL compliance status for an animal
// @route   GET /api/mrl/animal/:animalId/status
// @access  Private (Farmer)
export const getAnimalMRLStatus = async (req, res) => {
    try {
        const { animalId } = req.params;
        const farmerId = req.user._id;

        // Verify animal ownership
        const animal = await Animal.findOne({ tagId: animalId, farmerId });
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found' });
        }

        // Get recent treatments (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const recentTreatments = await Treatment.find({
            animalId,
            farmerId,
            status: 'Approved',
            startDate: { $gte: ninetyDaysAgo }
        }).populate('mrlTestResults').sort({ startDate: -1 });

        // Get all lab tests for this animal (last 90 days)
        const labTests = await LabTest.find({
            animalId,
            farmerId,
            testDate: { $gte: ninetyDaysAgo }
        }).sort({ testDate: -1 });

        // Calculate MRL status
        let mrlStatus = 'SAFE'; // Default
        let statusMessage = 'No recent treatments or all MRL tests passed';
        let requiresTest = false;
        let canSellProducts = true;

        // Check if there are treatments without MRL tests
        const treatmentsNeedingTest = recentTreatments.filter(t => {
            const withinWithdrawal = t.withdrawalEndDate && new Date() < new Date(t.withdrawalEndDate);
            const hasRecentTest = t.mrlTestResults && t.mrlTestResults.length > 0;
            return !withinWithdrawal && !hasRecentTest && t.requiresMrlTest;
        });

        if (treatmentsNeedingTest.length > 0) {
            mrlStatus = 'TEST_REQUIRED';
            statusMessage = 'MRL testing required before product sale';
            requiresTest = true;
            canSellProducts = false;
        }

        // Check MRL test results - LATEST test takes priority
        if (labTests.length > 0) {
            const latestTest = labTests[0]; // Already sorted by testDate descending

            if (!latestTest.isPassed) {
                // Latest test failed - MRL violation
                mrlStatus = 'VIOLATION';
                statusMessage = 'MRL violation detected - products cannot be sold';
                canSellProducts = false;
            } else if (latestTest.isPassed) {
                // Latest test passed - safe for sale (even if awaiting regulator approval)
                mrlStatus = 'SAFE';
                statusMessage = latestTest.regulatorApproved
                    ? 'MRL compliant - regulator verified'
                    : 'Latest MRL test passed - safe for sale (pending regulator verification)';
                canSellProducts = true;
            }
        }

        // Check active withdrawal periods (overrides test results)
        const activeWithdrawal = recentTreatments.find(t =>
            t.withdrawalEndDate && new Date() < new Date(t.withdrawalEndDate)
        );

        if (activeWithdrawal) {
            mrlStatus = 'WITHDRAWAL_ACTIVE';
            statusMessage = `Withdrawal period active until ${new Date(activeWithdrawal.withdrawalEndDate).toLocaleDateString()}`;
            canSellProducts = false;
        }

        res.json({
            animalId,
            animalName: animal.name,
            species: animal.species,
            mrlStatus,
            statusMessage,
            canSellProducts,
            requiresTest,
            recentTreatments: recentTreatments.length,
            labTests: labTests.length,
            treatmentsNeedingTest: treatmentsNeedingTest.length,
            details: {
                treatments: recentTreatments.map(t => ({
                    id: t._id,
                    drugName: t.drugName,
                    startDate: t.startDate,
                    withdrawalEndDate: t.withdrawalEndDate,
                    mrlCompliant: t.mrlCompliant,
                    hasTest: t.mrlTestResults && t.mrlTestResults.length > 0
                })),
                labTests: labTests.map(t => ({
                    id: t._id,
                    drugName: t.drugName,
                    testDate: t.testDate,
                    isPassed: t.isPassed,
                    status: t.status
                }))
            }
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get all lab tests for logged-in farmer
// @route   GET /api/mrl/my-tests
// @access  Private (Farmer)
export const getMyLabTests = async (req, res) => {
    try {
        const farmerId = req.user._id;

        const tests = await LabTest.find({ farmerId })
            .sort({ testDate: -1 })
            .limit(50);

        res.json({
            count: tests.length,
            data: tests
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get animals needing MRL testing
// @route   GET /api/mrl/pending-tests
// @access  Private (Farmer)
export const getAnimalsPendingMRLTest = async (req, res) => {
    try {
        const farmerId = req.user._id;

        // Get all active animals
        const animals = await Animal.find({ farmerId, status: 'Active' });

        const animalStatuses = await Promise.all(
            animals.map(async (animal) => {
                // Get recent treatments
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const recentTreatments = await Treatment.find({
                    animalId: animal.tagId,
                    farmerId,
                    status: 'Approved',
                    startDate: { $gte: thirtyDaysAgo }
                });

                // Check if withdrawal period is complete
                const completedWithdrawals = recentTreatments.filter(t =>
                    t.withdrawalEndDate && new Date() >= new Date(t.withdrawalEndDate)
                );

                // Check if MRL tests exist
                const hasTests = await LabTest.exists({
                    animalId: animal.tagId,
                    farmerId,
                    testDate: { $gte: thirtyDaysAgo }
                });

                if (completedWithdrawals.length > 0 && !hasTests) {
                    return {
                        animalId: animal.tagId,
                        animalName: animal.name,
                        species: animal.species,
                        treatmentsCount: completedWithdrawals.length,
                        lastTreatmentDate: completedWithdrawals[0].startDate,
                        needsTest: true
                    };
                }
                return null;
            })
        );

        const pendingTests = animalStatuses.filter(status => status !== null);

        res.json({
            count: pendingTests.length,
            data: pendingTests
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
