// Backend/controllers/labTechnician.controller.js

import LabTechnician from '../models/labTechnician.model.js';
import LabTest from '../models/labTest.model.js';
import Animal from '../models/animal.model.js';
import Farmer from '../models/farmer.model.js';
import { sendAlertToFarmer } from '../services/websocket.service.js';
import { createAuditLog } from '../services/auditLog.service.js';

/**
 * @desc    Get lab technician profile
 * @route   GET /api/lab/profile
 * @access  Private (Lab Technician)
 */
export const getLabTechProfile = async (req, res) => {
    try {
        const labTech = await LabTechnician.findById(req.user._id).select('-password');
        if (!labTech) {
            return res.status(404).json({ message: 'Lab Technician not found' });
        }
        res.json(labTech);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Upload MRL test result
 * @route   POST /api/lab/mrl-tests
 * @access  Private (Lab Technician)
 */
export const uploadMRLTest = async (req, res) => {
    try {
        const {
            animalId,
            drugName,
            sampleType,
            productType,
            residueLevelDetected,
            unit,
            mrlThreshold,
            testDate,
            testReportNumber,
            certificateUrl,
            notes
        } = req.body;

        // Validate required fields
        if (!animalId || !drugName || !sampleType || !productType || !residueLevelDetected || !mrlThreshold || !testReportNumber || !certificateUrl) {
            return res.status(400).json({ message: 'Animal ID, drug name, sample type, product type, residue level, MRL threshold, report number, and certificate URL are required' });
        }

        // Find the animal and its farmer
        const animal = await Animal.findOne({ tagId: animalId });
        if (!animal) {
            return res.status(404).json({ message: 'Animal with this Tag ID not found' });
        }

        const farmer = await Farmer.findById(animal.farmerId);
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found for this animal' });
        }

        // Calculate if test passed (residue level <= MRL threshold)
        const isPassed = parseFloat(residueLevelDetected) <= parseFloat(mrlThreshold);

        // Create the lab test record
        const labTest = await LabTest.create({
            farmerId: animal.farmerId,
            animalId,
            drugName,
            sampleType,
            productType,
            residueLevelDetected: parseFloat(residueLevelDetected),
            unit: unit || 'µg/kg',
            mrlThreshold: parseFloat(mrlThreshold),
            testDate: testDate ? new Date(testDate) : new Date(),
            labName: req.user.labName,
            labLocation: req.user.labLocation,
            labCertificationNumber: req.user.labCertificationNumber,
            testReportNumber,
            certificateUrl,
            isPassed,
            testedBy: req.user.fullName,
            notes,
            status: 'Pending Verification'
        });

        console.log(`[LAB] MRL Test uploaded by ${req.user.fullName}: Animal ${animalId}, Drug ${drugName}, Passed: ${isPassed}`);

        // Anchor to blockchain (non-blocking)
        let blockchainData = null;
        try {
            const { anchorLabTest } = await import('../services/blockchain.service.js');
            blockchainData = await anchorLabTest(labTest);

            // Update lab test with blockchain details
            labTest.blockchainHash = blockchainData.transactionHash;
            labTest.blockNumber = blockchainData.blockNumber;
            labTest.blockchainTimestamp = new Date();
            labTest.blockchainVerified = true;
            labTest.blockchainExplorerUrl = blockchainData.explorerUrl;
            await labTest.save();

            console.log(`✅ Lab test anchored to blockchain: ${blockchainData.transactionHash}`);
        } catch (error) {
            console.warn(`⚠️  Blockchain anchoring failed (continuing without it): ${error.message}`);
            // Continue without blockchain - don't fail the upload
        }

        // Create audit log
        console.log(`[DEBUG UPLOAD] blockchainData:`, blockchainData);
        console.log(`[DEBUG UPLOAD] Creating audit log with metadata.blockchain:`, blockchainData ? {
            transactionHash: blockchainData.transactionHash,
            blockNumber: blockchainData.blockNumber,
            explorerUrl: blockchainData.explorerUrl,
            verified: true
        } : { verified: false, reason: 'Blockchain not available' });

        await createAuditLog({
            eventType: 'CREATE',
            entityType: 'LabTest',
            entityId: labTest._id,
            farmerId: animal.farmerId,
            performedBy: req.user._id,
            performedByRole: 'Lab Technician',
            performedByModel: 'LabTechnician',
            dataSnapshot: labTest.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                notes: `MRL test for ${drugName} on animal ${animalId}`,
                blockchain: blockchainData ? {
                    transactionHash: blockchainData.transactionHash,
                    blockNumber: blockchainData.blockNumber,
                    explorerUrl: blockchainData.explorerUrl,
                    verified: true
                } : {
                    verified: false,
                    reason: 'Blockchain not available'
                }
            },
        });

        // Send notification to farmer
        sendAlertToFarmer(animal.farmerId.toString(), {
            type: isPassed ? 'MRL_TEST_PASSED' : 'MRL_TEST_FAILED',
            severity: isPassed ? 'success' : 'error',
            title: isPassed ? '✅ MRL Test Passed' : '❌ MRL Test Failed',
            message: isPassed
                ? `Your animal ${animal.name || animalId} passed the MRL test for ${drugName}. Products are safe for sale.`
                : `Your animal ${animal.name || animalId} FAILED the MRL test for ${drugName}. Products cannot be sold.`,
            data: {
                labTestId: labTest._id,
                animalId,
                animalName: animal.name || animalId,
                drugName,
                isPassed,
                residueLevelDetected,
                mrlThreshold,
            },
            action: {
                type: 'navigate',
                url: '/farmer/mrl-compliance'
            }
        });

        res.status(201).json({
            message: `MRL test uploaded successfully. Result: ${isPassed ? 'PASSED' : 'FAILED'}`,
            labTest,
            isPassed,
            blockchain: blockchainData ? {
                verified: true,
                transactionHash: blockchainData.transactionHash,
                blockNumber: blockchainData.blockNumber,
                explorerUrl: blockchainData.explorerUrl
            } : {
                verified: false,
                message: 'Blockchain verification not available'
            }
        });

    } catch (error) {
        console.error('Error uploading MRL test:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get all MRL tests uploaded by this lab technician
 * @route   GET /api/lab/mrl-tests
 * @access  Private (Lab Technician)
 */
export const getMyMRLTests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { testedBy: req.user.fullName };
        if (status && status !== 'all') {
            query.status = status;
        }

        const [labTests, totalCount] = await Promise.all([
            LabTest.find(query)
                .populate('farmerId', 'farmOwner farmName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            LabTest.countDocuments(query)
        ]);

        res.json({
            data: labTests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get dashboard stats for lab technician
 * @route   GET /api/lab/dashboard
 * @access  Private (Lab Technician)
 */
export const getLabDashboard = async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalTests,
            recentTests,
            passedTests,
            failedTests
        ] = await Promise.all([
            LabTest.countDocuments({ testedBy: req.user.fullName }),
            LabTest.countDocuments({ testedBy: req.user.fullName, testDate: { $gte: thirtyDaysAgo } }),
            LabTest.countDocuments({ testedBy: req.user.fullName, isPassed: true }),
            LabTest.countDocuments({ testedBy: req.user.fullName, isPassed: false })
        ]);

        const recentLabTests = await LabTest.find({ testedBy: req.user.fullName })
            .populate('farmerId', 'farmOwner farmName')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            stats: {
                totalTests,
                recentTests,
                passedTests,
                failedTests,
                passRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0
            },
            recentLabTests,
            labTechnician: {
                fullName: req.user.fullName,
                labName: req.user.labName,
                labTechId: req.user.labTechId
            }
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Find animal by Tag ID (for dropdown/search)
 * @route   GET /api/lab/animals/:tagId
 * @access  Private (Lab Technician)
 */
export const findAnimalByTagId = async (req, res) => {
    try {
        const { tagId } = req.params;

        const animal = await Animal.findOne({ tagId })
            .populate('farmerId', 'farmOwner farmName');

        if (!animal) {
            return res.status(404).json({ message: 'Animal not found with this Tag ID' });
        }

        res.json({
            tagId: animal.tagId,
            name: animal.name,
            species: animal.species,
            farmer: animal.farmerId ? {
                name: animal.farmerId.farmOwner,
                farmName: animal.farmerId.farmName
            } : null
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
