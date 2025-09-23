// backend/controllers/farmer.controller.js
import Farmer from '../models/farmer.model.js';

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

// ... (add any other farmer-related functions here, like registerFarmer, etc.)