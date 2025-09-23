// backend/controllers/auth.controller.js

import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerFarmer = async (req, res) => {
    const { farmOwner, email, password, farmName, vetId, phoneNumber } = req.body;
    try {
        const vetExists = await Veterinarian.findOne({ vetId: vetId });
        if (!vetExists) {
            return res.status(400).json({ message: 'Invalid Veterinarian ID.' });
        }

        const farmerExists = await Farmer.findOne({ email });
        if (farmerExists) {
            return res.status(400).json({ message: 'Farmer with this email already exists' });
        }
        
        const farmer = await Farmer.create({
            farmOwner, email, password, farmName, vetId, phoneNumber
        });
        
        if (farmer) {
            // THE FIX: Send both `farmOwner` and `farmName` consistently
            res.status(201).json({
                _id: farmer._id,
                farmOwner: farmer.farmOwner,
                farmName: farmer.farmName,
                email: farmer.email,
                role: 'farmer',
                token: generateToken(farmer._id),
                vetId: farmer.vetId,
            });
        } else {
            res.status(400).json({ message: 'Invalid farmer data' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


export const registerVet = async (req, res) => {
    const { fullName, email, password, licenseNumber } = req.body;
    try {
        const vetExists = await Veterinarian.findOne({ email });
        if (vetExists) {
            return res.status(400).json({ message: 'Veterinarian already exists' });
        }
        const vet = await Veterinarian.create({ fullName, email, password, licenseNumber, ...req.body });
        if (vet) {
            res.status(201).json({
                _id: vet._id,
                fullName: vet.fullName,
                email: vet.email,
                role: 'veterinarian',
                vetId: vet.vetId,
                token: generateToken(vet._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid veterinarian data' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await Farmer.findOne({ email });
        let role = 'farmer';

        if (!user) {
            user = await Veterinarian.findOne({ email });
            role = 'veterinarian';
        }

        if (user && (await bcrypt.compare(password, user.password))) {
            const responsePayload = {
                _id: user._id,
                email: user.email,
                role: role,
                token: generateToken(user._id),
            };
            
            // THE FIX: Add the correct, specific fields to the payload based on the user's role
            if (role === 'veterinarian') {
                responsePayload.fullName = user.fullName;
                responsePayload.vetId = user.vetId;
            }
            if (role === 'farmer') {
                responsePayload.farmOwner = user.farmOwner;
                responsePayload.farmName = user.farmName;
                responsePayload.vetId = user.vetId;
            }

            res.json(responsePayload);
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};