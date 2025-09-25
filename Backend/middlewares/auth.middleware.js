// backend/middlewares/auth.middleware.js

import jwt from 'jsonwebtoken';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import Regulator from '../models/regulator.model.js';
import Admin from '../models/admin.model.js'; // 1. Import the Admin model

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 2. UPDATED: Search all FOUR collections to find the user
            req.user = await Veterinarian.findById(decoded.id).select('-password') ||
                      await Farmer.findById(decoded.id).select('-password') ||
                      await Regulator.findById(decoded.id).select('-password') ||
                      await Admin.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Dynamically add the 'role' property for use in other middleware
            if (req.user.licenseNumber) req.user.role = 'veterinarian';
            else if (req.user.farmName) req.user.role = 'farmer';
            else if (req.user.agencyName) req.user.role = 'regulator';
            else if (req.user.email === 'admin@livestockiq.com') req.user.role = 'admin';
            
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const protectRegulator = (req, res, next) => {
    if (req.user && req.user.role === 'regulator') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized. Access restricted to regulators.' });
    }
};

// NEW: Middleware to protect routes for admins only
const protectAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized. Access restricted to admins.' });
    }
};

export { protect, protectRegulator, protectAdmin };