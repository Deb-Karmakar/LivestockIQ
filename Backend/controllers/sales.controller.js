// backend/controllers/sales.controller.js

import Sale from '../models/sale.model.js';
import Treatment from '../models/treatment.model.js';
import { createAuditLog } from '../services/auditLog.service.js';

// @desc    Log a new sale
// @route   POST /api/sales
// @access  Private (Farmer)
export const addSale = async (req, res) => {
    const { animalId, productType, quantity, unit, price, saleDate, notes } = req.body;
    const farmerId = req.user._id;

    try {
        // --- CRUCIAL SAFETY CHECK ---
        // Find the most recent 'Approved' treatment for this animal
        const lastTreatment = await Treatment.findOne({
            animalId: animalId,
            status: 'Approved'
        }).sort({ startDate: -1 });

        // If a recent treatment exists, check its withdrawal date
        if (lastTreatment && lastTreatment.withdrawalEndDate) {
            if (new Date() < new Date(lastTreatment.withdrawalEndDate)) {
                return res.status(400).json({
                    message: `Sale not allowed. Animal is still within a withdrawal period until ${lastTreatment.withdrawalEndDate.toLocaleDateString()}.`
                });
            }
        }
        // --- END SAFETY CHECK ---

        // If the animal is safe, create the sale record
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

        // Create audit log for sale creation
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
            },
        });

        res.status(201).json(sale);

    } catch (error) {
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