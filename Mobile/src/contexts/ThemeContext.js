import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const themes = {
    light: {
        mode: 'light',
        background: '#f3f4f6',
        card: '#ffffff',
        text: '#1f2937',
        subtext: '#6b7280',
        primary: '#10b981',
        border: '#e5e7eb',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
        info: '#3b82f6',
    },
    dark: {
        mode: 'dark',
        background: '#111827',
        card: '#1f2937',
        text: '#f9fafb',
        subtext: '#9ca3af',
        primary: '#34d399',
        border: '#374151',
        error: '#f87171',
        success: '#34d399',
        warning: '#fbbf24',
        info: '#60a5fa',
    },
    colorBlind: {
        mode: 'colorBlind',
        background: '#ffffff',
        card: '#f0f0f0',
        text: '#000000',
        subtext: '#555555',
        primary: '#0072b2', // Blue (Color Blind Safe)
        border: '#000000',
        error: '#d55e00', // Vermilion
        success: '#009e73', // Bluish Green
        warning: '#e69f00', // Orange
        info: '#56b4e9', // Sky Blue
    },
};

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState('light');
    const [theme, setTheme] = useState(themes.light);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const storedTheme = await AsyncStorage.getItem('userTheme');
            if (storedTheme && themes[storedTheme]) {
                setThemeMode(storedTheme);
                setTheme(themes[storedTheme]);
            }
        } catch (error) {
            console.error('Failed to load theme', error);
        }
    };

    const changeTheme = async (mode) => {
        try {
            if (themes[mode]) {
                setThemeMode(mode);
                setTheme(themes[mode]);
                await AsyncStorage.setItem('userTheme', mode);
            }
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, themeMode, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
