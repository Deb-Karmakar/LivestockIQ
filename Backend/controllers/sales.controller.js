// backend/controllers/sales.controller.js

import Sale from '../models/sale.model.js';
import Treatment from '../models/treatment.model.js';
import Animal from '../models/animal.model.js';
import { createAuditLog } from '../services/auditLog.service.js';
import { validateMRLCompliance, validateBulkMRLCompliance } from '../utils/mrlValidation.js';
import { sendSaleBlockedAlert } from '../services/websocket.service.js';
import { alertBlockedSaleAttempt, checkCompliancePatterns } from '../services/regulator.service.js';

// @desc    Log a new sale (with comprehensive MRL compliance checks)
// @route   POST /api/sales
// @access  Private (Farmer)
export const addSale = async (req, res) => {
    const { animalId, productType, quantity, unit, price, saleDate, notes } = req.body;
    const farmerId = req.user._id;

    try {
        // Verify animal belongs to this farmer
        const animal = await Animal.findOne({ tagId: animalId, farmerId });
        if (!animal) {
            return res.status(404).json({
                message: 'Animal not found or does not belong to you'
            });
        }

        // === ENHANCED MRL COMPLIANCE CHECK ===
        const mrlCheck = await validateMRLCompliance(animalId, farmerId, productType);

        if (!mrlCheck.canSell) {
            // Generate detailed error response based on violation type
            let statusCode = 400;
            let errorResponse = {
                message: mrlCheck.message,
                reason: mrlCheck.reason,
                canSell: false,
                details: mrlCheck.details
            };

            // Add specific guidance based on violation type
            switch (mrlCheck.reason) {
                case 'ACTIVE_WITHDRAWAL':
                    errorResponse.actionRequired = `Wait until ${new Date(mrlCheck.details.withdrawalEndDate).toLocaleDateString()} before selling products from this animal`;
                    errorResponse.guidance = 'The withdrawal period ensures drug residues have cleared from the animal\'s system';
                    break;

                case 'MRL_TEST_REQUIRED':
                    errorResponse.actionRequired = 'Conduct MRL testing at a certified laboratory before selling products';
                    errorResponse.guidance = 'MRL testing verifies that residue levels are below safe limits';
                    errorResponse.nextSteps = [
                        'Contact a certified laboratory',
                        'Collect sample from this animal',
                        'Upload test results to LivestockIQ',
                        'Wait for verification before sale'
                    ];
                    break;

                case 'MRL_VIOLATION':
                    statusCode = 403; // Forbidden
                    errorResponse.actionRequired = 'DO NOT SELL - MRL limit exceeded';
                    errorResponse.guidance = 'Products from this animal contain unsafe residue levels';
                    errorResponse.legalWarning = 'Selling non-compliant products may result in fines up to ₹50,000 and product recalls';
                    errorResponse.nextSteps = [
                        'Extend withdrawal period',
                        'Re-test after extended withdrawal',
                        'Consult with veterinarian'
                    ];
                    break;

                case 'MRL_TEST_EXPIRED':
                    errorResponse.actionRequired = 'MRL test is too old - re-testing required';
                    errorResponse.guidance = 'Tests older than 30 days may not reflect current residue levels';
                    break;

                default:
                    errorResponse.actionRequired = 'Resolve compliance issues before sale';
            }

            // Log the blocked sale attempt for audit trail
            await createAuditLog({
                eventType: 'BLOCKED',
                entityType: 'Sale',
                entityId: null,
                farmerId: farmerId,
                performedBy: req.user._id,
                performedByRole: 'Farmer',
                performedByModel: 'Farmer',
                dataSnapshot: {
                    animalId,
                    productType,
                    quantity,
                    blockReason: mrlCheck.reason,
                    attemptedSaleDate: saleDate
                },
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    notes: `Sale blocked: ${mrlCheck.message}`,
                    violationType: mrlCheck.reason
                },
            });

            // 📡 SEND WEBSOCKET ALERT
            sendSaleBlockedAlert(farmerId.toString(), {
                animalId,
                animalName: animal.name || animalId,
                reason: mrlCheck.message,
                blockReason: mrlCheck.reason,
                actionRequired: errorResponse.actionRequired
            });

            // 🚨 ALERT REGULATORS FOR CRITICAL VIOLATIONS
            if (mrlCheck.reason === 'MRL_VIOLATION' || mrlCheck.reason === 'MRL_TEST_REQUIRED') {
                await alertBlockedSaleAttempt(farmerId, {
                    animalId,
                    animalName: animal.name || animalId,
                    productType,
                    quantity,
                    blockReason: mrlCheck.reason
                });

                // Check compliance patterns
                checkCompliancePatterns(farmerId).catch(err =>
                    console.error('Error checking compliance patterns:', err)
                );
            }

            return res.status(statusCode).json(errorResponse);
        }

        // === MRL COMPLIANCE PASSED - ALLOW SALE ===

        // Create the sale record
        const sale = await Sale.create({
            animalId,
            farmerId,
            productType,
            quantity,
            unit,
            price,
            saleDate,
            notes
        });

        // Create audit log for successful sale
        await createAuditLog({
            eventType: 'CREATE',
            entityType: 'Sale',
            entityId: sale._id,
            farmerId: farmerId,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: sale.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                notes: `Sale of ${productType} for animal ${animalId}`,
                mrlCompliant: true,
                complianceDetails: mrlCheck.details
            },
        });

        res.status(201).json({
            message: 'Sale recorded successfully',
            sale,
            mrlCompliance: {
                status: 'COMPLIANT',
                verified: true,
                details: mrlCheck.details
            }
        });

    } catch (error) {
        console.error('Error in addSale:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get all sales for the logged-in farmer
// @route   GET /api/sales
// @access  Private (Farmer)
export const getMySales = async (req, res) => {
    try {
        const sales = await Sale.find({ farmerId: req.user._id }).sort({ saleDate: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Check if animal is safe to sell (pre-sale verification)
// @route   POST /api/sales/verify-compliance
// @access  Private (Farmer)
export const verifyPreSaleCompliance = async (req, res) => {
    try {
        const { animalId, productType } = req.body;
        const farmerId = req.user._id;

        if (!animalId || !productType) {
            return res.status(400).json({
                message: 'Please provide animalId and productType'
            });
        }

        // Verify animal ownership
        const animal = await Animal.findOne({ tagId: animalId, farmerId });
        if (!animal) {
            return res.status(404).json({
                message: 'Animal not found or does not belong to you'
            });
        }

        // Run MRL compliance check
        const mrlCheck = await validateMRLCompliance(animalId, farmerId, productType);

        res.json({
            animalId,
            animalName: animal.name || animalId,
            productType,
            compliance: {
                canSell: mrlCheck.canSell,
                status: mrlCheck.reason,
                message: mrlCheck.message,
                details: mrlCheck.details
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in verifyPreSaleCompliance:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Bulk compliance check for multiple animals
// @route   POST /api/sales/bulk-verify
// @access  Private (Farmer)
export const bulkVerifyCompliance = async (req, res) => {
    try {
        const { animalIds, productType } = req.body;
        const farmerId = req.user._id;

        if (!animalIds || !Array.isArray(animalIds) || animalIds.length === 0) {
            return res.status(400).json({
                message: 'Please provide an array of animalIds'
            });
        }

        if (animalIds.length > 50) {
            return res.status(400).json({
                message: 'Maximum 50 animals can be verified at once'
            });
        }

        // Run bulk validation
        const bulkCheck = await validateBulkMRLCompliance(animalIds, farmerId, productType || 'Milk');

        res.json({
            productType: productType || 'Milk',
            summary: {
                totalAnimals: bulkCheck.totalAnimals,
                compliantAnimals: bulkCheck.compliantAnimals,
                violations: bulkCheck.violations,
                allCompliant: bulkCheck.allCompliant
            },
            results: bulkCheck.results,
            violationSummary: bulkCheck.violationSummary,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in bulkVerifyCompliance:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};