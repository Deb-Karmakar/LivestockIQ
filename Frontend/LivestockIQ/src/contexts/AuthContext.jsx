import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:5000/api/';

const axiosInstance = axios.create({
    baseURL: API_URL,
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        console.log('Request headers:', config.headers);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
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
            console.log('Loaded user from localStorage:', parsedUser);
            setUser(parsedUser);
            if (parsedUser.token) {
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
                console.log('Set Authorization header:', parsedUser.token);
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

    const login = async (email, password) => {
        try {
            const response = await axiosInstance.post('auth/login', { email, password });
            if (response.data) {
                console.log('Login successful:', response.data);
                localStorage.setItem('userInfo', JSON.stringify(response.data));
                setUser(response.data);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                if (response.data.role === 'veterinarian') {
                    navigate('/vet/dashboard');
                } else {
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
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export { axiosInstance };