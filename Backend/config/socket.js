// Backend/config/socket.js

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Regulator from '../models/regulator.model.js';

/**
 * Socket.io Configuration and Authentication
 */

export const initializeSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if role exists
            if (!decoded.role) {
                return next(new Error('Authentication error: No role found in token'));
            }

            // Fetch user based on role (case-insensitive)
            const role = decoded.role.toLowerCase();
            let user;
            if (role === 'farmer') {
                user = await Farmer.findById(decoded.id);
            } else if (role === 'veterinarian') {
                user = await Veterinarian.findById(decoded.id);
            } else if (role === 'regulator') {
                user = await Regulator.findById(decoded.id);
            }

            if (!user) {
                console.error(`User not found for role ${decoded.role}, id ${decoded.id}`);
                return next(new Error('Authentication error: User not found'));
            }

            // Attach user info to socket
            socket.user = {
                id: decoded.id,
                role: decoded.role,
                userData: user
            };

            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Handle connections
    io.on('connection', (socket) => {
        const { id, role } = socket.user;

        console.log(`✅ WebSocket client connected: ${role} ${id}`);

        // Join role-specific rooms (case-insensitive)
        const roleLC = role.toLowerCase();
        if (roleLC === 'farmer') {
            socket.join(`farmer:${id}`);
            console.log(`   📍 Joined room: farmer:${id}`);
        } else if (roleLC === 'veterinarian') {
            socket.join(`vet:${socket.user.userData.vetId || id}`);
            console.log(`   📍 Joined room: vet:${socket.user.userData.vetId || id}`);
        } else if (roleLC === 'regulator') {
            socket.join('regulators');
            console.log(`   📍 Joined room: regulators`);
        }

        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to LivestockIQ real-time alerts',
            userId: id,
            role: role,
            timestamp: new Date().toISOString()
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`❌ WebSocket client disconnected: ${role} ${id}`);
        });

        // Handle ping/pong for connection monitoring
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });

        // Handle client acknowledgment of alerts
        socket.on('alert:acknowledge', (data) => {
            console.log(`   ✓ Alert acknowledged by ${role} ${id}:`, data.alertType);
        });
    });

    return io;
};
