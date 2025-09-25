// backend/controllers/farmer.controller.js
import Farmer from '../models/farmer.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js'; 
import Treatment from '../models/treatment.model.js';
import { subDays, subMonths } from 'date-fns';

// @desc    Get the profile of the logged-in farmer
// @route   GET /api/farmers/profile
// @access  Private
export const getFarmerProfile = async (req, res) => {
    // The 'protect' middleware already attaches the user's ID to req.user._id
    const farmer = await Farmer.findById(req.user._id).select('-password'); // Exclude password from result

    if (farmer) {
        res.json(farmer);
    } else {
        res.status(404).json({ message: 'Farmer not found' });
    }
};

export const updateFarmerProfile = async (req, res) => {
    try {
        const farmer = await Farmer.findById(req.user._id);

        if (farmer) {
            // Update editable fields from the request body
            farmer.farmOwner = req.body.farmOwner || farmer.farmOwner;
            farmer.phoneNumber = req.body.phoneNumber || farmer.phoneNumber;
            farmer.farmName = req.body.farmName || farmer.farmName;
            
            // NEW: Add speciesReared and herdSize to the update logic
            farmer.speciesReared = req.body.speciesReared || farmer.speciesReared;
            farmer.herdSize = req.body.herdSize || farmer.herdSize;

            if (req.body.location) {
                farmer.location = req.body.location;
            }

            const updatedFarmer = await farmer.save();

            // Send back the full updated user info (excluding password)
            res.json({
                _id: updatedFarmer._id,
                farmOwner: updatedFarmer.farmOwner,
                farmName: updatedFarmer.farmName,
                email: updatedFarmer.email,
                phoneNumber: updatedFarmer.phoneNumber,
                location: updatedFarmer.location,
                speciesReared: updatedFarmer.speciesReared,
                herdSize: updatedFarmer.herdSize,
            });
        } else {
            res.status(404).json({ message: 'Farmer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


export const getMyHighAmuAlerts = async (req, res) => {
    try {
        const alerts = await HighAmuAlert.find({ 
            farmerId: req.user._id,
            status: 'New' 
        }).sort({ createdAt: -1 });
        
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getHighAmuAlertDetails = async (req, res) => {
    try {
        const { alertId } = req.params;
        const farmerId = req.user._id;

        // 1. Find the alert and verify ownership
        const alert = await HighAmuAlert.findById(alertId);
        if (!alert || alert.farmerId.toString() !== farmerId.toString()) {
            return res.status(401).json({ message: 'Not authorized to view this alert.' });
        }

        // 2. Re-calculate the date ranges based on when the alert was created
        const alertDate = alert.createdAt;
        const last7DaysStart = subDays(alertDate, 7);
        const last6MonthsStart = subMonths(alertDate, 6);
        
        // 3. Fetch the specific treatments that contributed to the alert
        const [spikeTreatments, baselineTreatments] = await Promise.all([
            // Get the "spike" treatments from the week the alert was generated
            Treatment.find({
                farmerId: farmerId,
                status: 'Approved',
                createdAt: { $gte: last7DaysStart, $lte: alertDate }
            }).sort({ createdAt: -1 }),
            // Get the "baseline" treatments from the 6 months prior
             Treatment.find({
                farmerId: farmerId,
                status: 'Approved',
                createdAt: { $gte: last6MonthsStart, $lt: last7DaysStart }
            }).sort({ createdAt: -1 })
        ]);
        
        res.json({ alert, spikeTreatments, baselineTreatments });

    } catch (error) {
        console.error("Error fetching AMU alert details:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};