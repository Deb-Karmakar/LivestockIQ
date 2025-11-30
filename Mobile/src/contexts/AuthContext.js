// Mobile/src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const [token, userData] = await Promise.all([
                authService.getToken(),
                authService.getCurrentUser(),
            ]);

            if (token && userData) {
                setUser(userData);
                setIsAuth(true);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const { token, user: userData } = await authService.login(email, password);
            setUser(userData);
            setIsAuth(true);
            return userData;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            await authService.register(userData);
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setIsAuth(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuth, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
