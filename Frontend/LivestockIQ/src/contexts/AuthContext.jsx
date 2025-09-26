import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);
// In frontend/src/contexts/AuthContext.jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/';

const axiosInstance = axios.create({
    baseURL: API_URL,
});

// Interceptors for debugging (unchanged)
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('Response received:', response.data);
        return response;
    },
    (error) => {
        console.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.token) {
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
            }
        }
    }, []);

    const register = async (formData) => {
        try {
            const response = await axiosInstance.post('auth/register/farmer', formData);
            if (response.data) {
                localStorage.setItem('userInfo', JSON.stringify(response.data));
                setUser(response.data);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                navigate('/farmer/dashboard');
            }
        } catch (error) {
            console.error("Farmer registration failed:", error.response?.data?.message || error.message);
            alert(`Registration Failed: ${error.response?.data?.message || 'Server Error'}`);
        }
    };

    const registerVet = async (formData) => {
        try {
            const response = await axiosInstance.post('auth/register/vet', formData);
            if (response.data) {
                localStorage.setItem('userInfo', JSON.stringify(response.data));
                setUser(response.data);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                navigate('/vet/dashboard');
            }
        } catch (error) {
            console.error("Vet registration failed:", error.response?.data?.message || error.message);
            alert(`Registration Failed: ${error.response?.data?.message || 'Server Error'}`);
        }
    };

    // NEW: Function to handle regulator registration
    const registerRegulator = async (regulatorData) => {
        try {
            const { data } = await axiosInstance.post('/auth/register/regulator', regulatorData);
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            navigate('/regulator/dashboard'); // Redirect to the regulator's dashboard
        } catch (error) {
            console.error("Regulator registration failed:", error.response.data.message);
            alert(`Registration failed: ${error.response.data.message}`);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axiosInstance.post('auth/login', { email, password });
            if (response.data) {
                localStorage.setItem('userInfo', JSON.stringify(response.data));
                setUser(response.data);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                
                // UPDATED: Handle redirect for all three roles
                const { role } = response.data;
                if (role === 'veterinarian') {
                    navigate('/vet/dashboard');
                } else if (role === 'regulator') {
                    navigate('/regulator/dashboard');
                } else { // Default to farmer
                    navigate('/farmer/dashboard');
                }
            }
        } catch (error) {
            console.error("Login failed:", error.response?.data?.message || error.message);
            alert(`Login Failed: ${error.response?.data?.message || 'Server Error'}`);
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
        delete axiosInstance.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    const value = {
        user,
        isAuth: !!user,
        login,
        register,
        registerVet,
        registerRegulator, // EXPORT: Make the new function available
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export { axiosInstance };