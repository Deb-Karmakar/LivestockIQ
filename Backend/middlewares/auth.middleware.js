// backend/middlewares/auth.middleware.js

import jwt from 'jsonwebtoken';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import Regulator from '../models/regulator.model.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // UPDATED: Search all three collections to find the user.
            // This ensures that a logged-in regulator is found correctly.
            req.user = await Veterinarian.findById(decoded.id).select('-password') ||
                      await Farmer.findById(decoded.id).select('-password') ||
                      await Regulator.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Dynamically add the 'role' property to req.user for middleware checks
            if (req.user.licenseNumber) req.user.role = 'veterinarian';
            else if (req.user.farmName) req.user.role = 'farmer';
            else if (req.user.agencyName) req.user.role = 'regulator';
            
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// This middleware should be used *after* the 'protect' middleware.
const protectRegulator = (req, res, next) => {
    // UPDATED: A more robust check for the regulator role.
    if (req.user && req.user.role === 'regulator') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized. Access restricted to regulators.' });
    }
};

export { protect, protectRegulator };