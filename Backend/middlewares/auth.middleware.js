// backend/middlewares/auth.middleware.js

import jwt from 'jsonwebtoken';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import Regulator from '../models/regulator.model.js';
import Admin from '../models/admin.model.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            console.log('🔍 Auth Debug - Token decoded:', { id: decoded.id, role: decoded.role });

            // Search all FOUR collections to find the user
            req.user = await Veterinarian.findById(decoded.id).select('-password') ||
                await Farmer.findById(decoded.id).select('-password') ||
                await Regulator.findById(decoded.id).select('-password') ||
                await Admin.findById(decoded.id).select('-password');

            if (!req.user) {
                console.log('❌ Auth - User not found');
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // IMPROVED: Use role from JWT token first (more reliable), fallback to field detection
            if (decoded.role) {
                req.user.role = decoded.role;
            } else {
                // Fallback: Dynamically detect role from user properties
                if (req.user.licenseNumber) req.user.role = 'veterinarian';
                else if (req.user.farmName) req.user.role = 'farmer';
                else if (req.user.agencyName) req.user.role = 'regulator';
                else if (req.user.email === 'admin@livestockiq.com') req.user.role = 'admin';
            }

            console.log('✅ Auth - User role:', req.user.role);
            next();
        } catch (error) {
            console.log('❌ Auth - Token failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log('❌ Auth - No token provided');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const protectRegulator = (req, res, next) => {
    console.log('🔍 Regulator Check - User:', { id: req.user?._id, role: req.user?.role });
    if (req.user && req.user.role === 'regulator') {
        console.log('✅ Regulator access granted');
        next();
    } else {
        console.log('❌ Regulator access denied - role is:', req.user?.role);
        res.status(401).json({ message: 'Not authorized. Access restricted to regulators.' });
    }
};

// Middleware to protect routes for admins only
const protectAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized. Access restricted to admins.' });
    }
};

export { protect, protectRegulator, protectAdmin };