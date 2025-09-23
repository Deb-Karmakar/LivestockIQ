import jwt from 'jsonwebtoken';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import Regulator from '../models/regulator.model.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token's ID and attach it to the request
            // We search both collections. Exclude the password field.
            req.user = await Veterinarian.findById(decoded.id).select('-password') ||
                       await Farmer.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Move to the next step
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export { protect };