// Backend/controllers/mrl.controller.js

import MRL from '../models/mrl.model.js';
import LabTest from '../models/labTest.model.js';
import Treatment from '../models/treatment.model.js';
import Animal from '../models/animal.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
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

        // Get feed administrations for this animal
        const feedAdministrations = await FeedAdministration.find({
            animalIds: animalId,
            farmerId
        });

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

        // First, check MRL test results - LATEST test determines base status
        if (labTests.length > 0) {
            const latestTest = labTests[0]; // Already sorted by testDate descending

            if (!latestTest.isPassed) {
                if (latestTest.violationResolved) {
                    // Violation resolved by regulator - allow re-test
                    mrlStatus = 'TEST_REQUIRED';
                    statusMessage = 'Previous violation resolved - new MRL test required';
                    requiresTest = true;
                    canSellProducts = false;
                } else {
                    // Latest test failed - MRL violation
                    mrlStatus = 'VIOLATION';
                    statusMessage = 'MRL violation detected - products cannot be sold';
                    canSellProducts = false;
                }
            } else if (latestTest.isPassed) {
                // Check if regulator rejected the test (even though it passed system check)
                if (latestTest.status === 'Rejected' && latestTest.regulatorApproved === false) {
                    // Regulator rejected the passed test - farmer needs to upload a new test
                    mrlStatus = 'TEST_REQUIRED';
                    statusMessage = 'Previous test rejected by regulator - new MRL test required';
                    requiresTest = true;
                    canSellProducts = false;
                } else if (latestTest.regulatorApproved) {
                    // Regulator verified - safe for sale
                    mrlStatus = 'SAFE';
                    statusMessage = 'MRL compliant - regulator verified';
                    canSellProducts = true;
                } else {
                    // Passed system check but pending regulator verification - NOT safe for sale yet
                    mrlStatus = 'PENDING_VERIFICATION';
                    statusMessage = 'Latest MRL test passed system check - awaiting regulator verification';
                    canSellProducts = false;
                }
            }
        }

        // Then check if there are treatments without MRL tests AFTER their withdrawal period
        // This will OVERRIDE the test status if treatments need testing
        const treatmentsNeedingTest = recentTreatments.filter(t => {
            const withinWithdrawal = t.withdrawalEndDate && new Date() < new Date(t.withdrawalEndDate);

            // Check if there's a lab test AFTER this treatment's withdrawal period
            const hasTestAfterWithdrawal = labTests.some(test =>
                new Date(test.testDate) > new Date(t.withdrawalEndDate || t.startDate)
            );

            return !withinWithdrawal && !hasTestAfterWithdrawal && t.requiresMrlTest;
        });

        // Check for feed administrations needing tests (only active/approved ones)
        const feedNeedingTest = feedAdministrations.filter(f => {
            if (f.status !== 'Active') return false;
            const withinWithdrawal = f.withdrawalEndDate && new Date() < new Date(f.withdrawalEndDate);
            const hasTestAfterWithdrawal = labTests.some(test =>
                new Date(test.testDate) > new Date(f.withdrawalEndDate || f.startDate)
            );
            return !withinWithdrawal && !hasTestAfterWithdrawal && f.requiresMrlTest;
        });

        // Override status if treatments need testing
        if (treatmentsNeedingTest.length > 0 || feedNeedingTest.length > 0) {
            mrlStatus = 'TEST_REQUIRED';
            statusMessage = 'MRL testing required before product sale';
            requiresTest = true;
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
                    status: t.status,
                    violationResolved: t.violationResolved
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

// ==================== REGULATOR FUNCTIONS ====================

// @desc    Get pending MRL verifications for regulators
// @route   GET /api/mrl/regulator/pending-verifications
// @access  Private (Regulator)
export const getPendingMRLVerifications = async (req, res) => {
    try {
        // Check if user is regulator
        if (req.user.role !== 'regulator') {
            return res.status(403).json({ message: 'Access denied. Regulators only.' });
        }

        const { limit = 50, status = 'Pending Verification' } = req.query;

        // Only show tests that PASSED the MRL check (failed tests go to alerts page)
        const tests = await LabTest.find({ status, isPassed: true })
            .populate('farmerId', 'farmName email phone')
            .populate('animalId', 'name tagId species')
            .sort({ testDate: -1 })
            .limit(parseInt(limit));

        res.json({
            count: tests.length,
            tests
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get verification statistics for regulators
// @route   GET /api/mrl/regulator/verification-stats
// @access  Private (Regulator)
export const getVerificationStats = async (req, res) => {
    try {
        // Check if user is regulator
        if (req.user.role !== 'regulator') {
            return res.status(403).json({ message: 'Access denied. Regulators only.' });
        }

        // Only count passed tests in pending (failed tests are for alerts page)
        const [pending, approved, rejected] = await Promise.all([
            LabTest.countDocuments({ status: 'Pending Verification', isPassed: true }),
            LabTest.countDocuments({ status: 'Approved', regulatorApproved: true }),
            LabTest.countDocuments({ status: 'Rejected', regulatorApproved: false })
        ]);

        // All pending tests are passed (since we filter by isPassed: true)
        res.json({
            pending: {
                total: pending,
                passed: pending,
                failed: 0
            },
            approved,
            rejected
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get lab test details for verification
// @route   GET /api/mrl/regulator/test/:id
// @access  Private (Regulator)
export const getLabTestForVerification = async (req, res) => {
    try {
        // Check if user is regulator
        if (req.user.role !== 'regulator') {
            return res.status(403).json({ message: 'Access denied. Regulators only.' });
        }

        const test = await LabTest.findById(req.params.id)
            .populate('farmerId', 'farmName email phone address')
            .populate('animalId', 'name tagId species breed')
            .populate('treatmentId');

        if (!test) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        res.json({ test });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Verify/Approve or Reject lab test
// @route   PUT /api/mrl/regulator/verify/:id
// @access  Private (Regulator)
export const verifyLabTest = async (req, res) => {
    try {
        // Check if user is regulator
        if (req.user.role !== 'regulator') {
            return res.status(403).json({ message: 'Access denied. Regulators only.' });
        }

        const { approved, notes } = req.body;

        const test = await LabTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        // Update test status
        test.regulatorApproved = approved;
        test.regulatorId = req.user._id;
        test.regulatorNotes = notes || '';
        test.verifiedAt = new Date();
        test.status = approved ? 'Approved' : 'Rejected';

        await test.save();

        res.json({
            message: approved ? 'Test approved successfully' : 'Test rejected',
            test
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};