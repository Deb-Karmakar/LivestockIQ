import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const storedLang = await AsyncStorage.getItem('userLanguage');
            if (storedLang) {
                setLanguage(storedLang);
            }
        } catch (error) {
            console.error('Failed to load language', error);
        }
    };

    const changeLanguage = async (lang) => {
        try {
            setLanguage(lang);
            await AsyncStorage.setItem('userLanguage', lang);
        } catch (error) {
            console.error('Failed to save language', error);
        }
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
