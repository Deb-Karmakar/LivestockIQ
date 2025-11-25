import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Regulator from '../models/regulator.model.js'; 
import Admin from '../models/admin.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerFarmer = async (req, res) => {
    // UPDATED: Added 'location' to the list of expected fields
    const { farmOwner, email, password, farmName, vetId, phoneNumber, location } = req.body;
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
            farmOwner, 
            email, 
            password, 
            farmName, 
            vetId, 
            phoneNumber, 
            location // UPDATED: Pass the location object to be saved
        });
        
        if (farmer) {
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
    const { fullName, email, password, licenseNumber, location } = req.body;
    try {
        const vetExists = await Veterinarian.findOne({ email });
        if (vetExists) {
            return res.status(400).json({ message: 'Veterinarian already exists' });
        }
        
        // Create vet with all data including location
        const vet = await Veterinarian.create({
            fullName, 
            email, 
            password, 
            licenseNumber,
            location, // Explicitly include location
            ...req.body // This will capture all other fields
        });
        
        if (vet) {
            res.status(201).json({
                _id: vet._id,
                fullName: vet.fullName,
                email: vet.email,
                role: 'veterinarian',
                vetId: vet.vetId,
                location: vet.location, // Include location in response
                token: generateToken(vet._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid veterinarian data' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// NEW: Function to register a new Regulator
export const registerRegulator = async (req, res) => {
    const { fullName, email, password, agencyName, regulatorId, jurisdiction, phoneNumber } = req.body;

    try {
        const regulatorExists = await Regulator.findOne({ email });
        if (regulatorExists) {
            return res.status(400).json({ message: 'Regulator with this email already exists' });
        }

        const regulator = await Regulator.create({
            fullName, email, password, agencyName, regulatorId, jurisdiction, phoneNumber
        });

        if (regulator) {
            res.status(201).json({
                _id: regulator._id,
                fullName: regulator.fullName,
                email: regulator.email,
                agencyName: regulator.agencyName,
                role: 'regulator',
                token: generateToken(regulator._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid regulator data' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user;
        let role;

        // Sequentially check each collection to find the user
        user = await Farmer.findOne({ email });
        if (user) { role = 'farmer'; }

        if (!user) {
            user = await Veterinarian.findOne({ email });
            if (user) { role = 'veterinarian'; }
        }
        
        if (!user) {
            user = await Regulator.findOne({ email });
            if (user) { role = 'regulator'; }
        }

        if (!user) {
            user = await Admin.findOne({ email });
            if (user) { role = 'admin'; }
        }

        // If a user was found in any collection, check the password
        if (user && (await bcrypt.compare(password, user.password))) {
            const responsePayload = {
                _id: user._id,
                email: user.email,
                role: role,
                token: generateToken(user._id),
            };
            
            // Add role-specific details to the payload
            if (role === 'veterinarian') {
                responsePayload.fullName = user.fullName;
                responsePayload.vetId = user.vetId;
            }
            if (role === 'farmer') {
                responsePayload.farmOwner = user.farmOwner;
                responsePayload.farmName = user.farmName;
                responsePayload.vetId = user.vetId;
            }
            if (role === 'regulator') {
                responsePayload.fullName = user.fullName;
                responsePayload.agencyName = user.agencyName;
            }
            if (role === 'admin') {
                responsePayload.fullName = user.fullName;
            }

            return res.json(responsePayload);
        } else {
            // If no user was found OR the password did not match
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};