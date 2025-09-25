// backend/controllers/farmer.controller.js
import Farmer from '../models/farmer.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js'; // 1. Import the alert model


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
            farmer.farmOwner = req.body.farmOwner || farmer.farmOwner;
            farmer.phoneNumber = req.body.phoneNumber || farmer.phoneNumber;
            farmer.farmName = req.body.farmName || farmer.farmName;
            
            if (req.body.location) {
                farmer.location = req.body.location;
            }

            const updatedFarmer = await farmer.save();
            res.json(updatedFarmer);
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