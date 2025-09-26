// frontend/src/services/chatService.js

import { axiosInstance } from '../contexts/AuthContext';

// This function talks to your Gemini backend endpoint
export const sendMessageToAI = async (message, history) => {
    try {
        const { data } = await axiosInstance.post('/chat', { message, history });
        return data;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        throw error;
    }
};

// This function talks to your NEW Groq backend endpoint
export const sendMessageToGroq = async (message, history) => {
    try {
        const { data } = await axiosInstance.post('/groq/chat', { message, history });
        return data;
    } catch (error) {
        console.error("Error sending message to Groq:", error);
        throw error;
    }
};