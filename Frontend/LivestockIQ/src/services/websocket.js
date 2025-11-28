// Frontend/LivestockIQ/src/services/websocket.js

import { io } from 'socket.io-client';

/**
 * WebSocket Client for Real-time Notifications
 * Connects to backend Socket.io server for live alerts
 */

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize WebSocket connection
 * @param {string} token - JWT authentication token
 * @param {Function} onAlert - Callback for incoming alerts
 * @param {Function} onConnect - Callback for connection established
 * @param {Function} onDisconnect - Callback for disconnection
 */
export const initializeWebSocket = (token, onAlert, onConnect, onDisconnect) => {
    if (socket) {
        if (socket.connected) {
            console.log('WebSocket already connected');
            return socket;
        }
        // If socket exists but is not connected (e.g. connecting or disconnected),
        // clean it up before creating a new one
        socket.disconnect();
        socket = null;
    }

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    socket = io(BACKEND_URL, {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS
    });

    // Connection successful
    socket.on('connected', (data) => {
        console.log('✅ WebSocket connected:', data);
        reconnectAttempts = 0;
        if (onConnect) onConnect(data);
    });

    // Receive alerts
    socket.on('alert', (alert) => {
        console.log('📡 Alert received:', alert.type);
        if (onAlert) onAlert(alert);
    });

    // Connection error
    socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        reconnectAttempts++;

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('Max reconnection attempts reached. Giving up.');
            socket.disconnect();
        }
    });

    // Disconnection
    socket.on('disconnect', (reason) => {
        console.log(' WebSocket disconnected:', reason);
        if (onDisconnect) onDisconnect(reason);
    });

    // Ping/Pong for connection monitoring
    socket.on('pong', (data) => {
        // Connection is alive
    });

    // Send ping every 30 seconds to keep connection alive
    setInterval(() => {
        if (socket && socket.connected) {
            socket.emit('ping');
        }
    }, 30000);

    return socket;
};

/**
 * Disconnect WebSocket
 */
export const disconnectWebSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('WebSocket disconnected');
    }
};

/**
 * Get current socket instance
 */
export const getSocket = () => socket;

/**
 * Check if WebSocket is connected
 */
export const isConnected = () => socket && socket.connected;

/**
 * Acknowledge alert (notify server user saw it)
 */
export const acknowledgeAlert = (alertType, alertId) => {
    if (socket && socket.connected) {
        socket.emit('alert:acknowledge', {
            alertType,
            alertId,
            timestamp: new Date().toISOString()
        });
    }
};
