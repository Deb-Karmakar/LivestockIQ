// Frontend/LivestockIQ/src/contexts/NotificationContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeWebSocket, disconnectWebSocket, acknowledgeAlert } from '../services/websocket';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    // Handle incoming alerts from WebSocket
    const handleAlert = useCallback((alert) => {
        console.log('Alert received in context:', alert);

        // Add to notifications list
        const newNotification = {
            id: `${alert.type}_${Date.now()}`,
            ...alert,
            read: false,
            receivedAt: new Date()
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
        setUnreadCount(prev => prev + 1);

        // Show toast notification based on severity
        showToast(alert);
    }, []);

    // Show toast notification
    const showToast = (alert) => {
        const { severity, title, message } = alert;

        const toastOptions = {
            duration: severity === 'critical' || severity === 'urgent' ? 10000 : 5000,
            position: 'top-right',
            style: {
                borderRadius: '10px',
                background: getToastBackground(severity),
                color: '#fff',
                padding: '16px',
            },
            icon: getToastIcon(severity),
        };

        toast(
            <div>
                <strong>{title}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{message}</p>
            </div>,
            toastOptions
        );
    };

    // Get toast background color based on severity
    const getToastBackground = (severity) => {
        switch (severity) {
            case 'critical': return 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
            case 'urgent': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            case 'warning': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            case 'success': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            default: return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        }
    };

    // Get toast icon based on severity
    const getToastIcon = (severity) => {
        switch (severity) {
            case 'critical': return '🚨';
            case 'urgent': return '⚠️';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            default: return 'ℹ️';
        }
    };

    // Initialize WebSocket connection
    // Note: Empty dependency array ensures WebSocket is initialized only once on mount
    // handleAlert is stable due to useCallback, so it doesn't need to be a dependency
    useEffect(() => {
        let connectionTimer;

        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                const token = parsed.token;

                if (token) {
                    // Add a small delay to prevent double connections in React Strict Mode
                    connectionTimer = setTimeout(() => {
                        initializeWebSocket(
                            token,
                            handleAlert,
                            (data) => {
                                console.log('WebSocket connected:', data);
                                setIsConnected(true);
                            },
                            (reason) => {
                                console.log('WebSocket disconnected:', reason);
                                setIsConnected(false);
                            }
                        );
                    }, 100);
                }
            } catch (error) {
                console.error('Error parsing userInfo from localStorage:', error);
            }
        }

        return () => {
            if (connectionTimer) clearTimeout(connectionTimer);
            disconnectWebSocket();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Mark notification as read
    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Acknowledge to server
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            acknowledgeAlert(notification.type, notificationId);
        }
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
    };

    // Clear all notifications
    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const value = {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearAll
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
