// backend/middlewares/auth.middleware.js

import jwt from 'jsonwebtoken';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import Regulator from '../models/regulator.model.js';
import Admin from '../models/admin.model.js';
import LabTechnician from '../models/labTechnician.model.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Search all FIVE collections to find the user
            req.user = await Veterinarian.findById(decoded.id).select('-password') ||
                await Farmer.findById(decoded.id).select('-password') ||
                await Regulator.findById(decoded.id).select('-password') ||
                await Admin.findById(decoded.id).select('-password') ||
                await LabTechnician.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Use role from JWT token first (more reliable), fallback to field detection
            if (decoded.role) {
                req.user.role = decoded.role;
            } else {
                // Fallback: Dynamically detect role from user properties
                if (req.user.licenseNumber) req.user.role = 'veterinarian';
                else if (req.user.farmName) req.user.role = 'farmer';
                else if (req.user.agencyName) req.user.role = 'regulator';
                else if (req.user.labTechId) req.user.role = 'labTechnician';
                else if (req.user.email === 'admin@livestockiq.com') req.user.role = 'admin';
            }

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

// Middleware to protect routes for admins only
const protectAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized. Access restricted to admins.' });
    }
};

// Middleware to protect routes for lab technicians only
const protectLabTechnician = (req, res, next) => {
    if (req.user && req.user.role === 'labTechnician') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized. Access restricted to lab technicians.' });
    }
};

// Middleware to protect routes for admins OR regulators
const protectAdminOrRegulator = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'regulator')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized. Access restricted to admins or regulators.' });
    }
};

export { protect, protectRegulator, protectAdmin, protectLabTechnician, protectAdminOrRegulator };

