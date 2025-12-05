// frontend/src/services/chatService.js

import { axiosInstance } from '../contexts/AuthContext';

// This function talks to your Gemini backend endpoint (legacy)
export const sendMessageToAI = async (message, history) => {
    try {
        const { data } = await axiosInstance.post('/chat', { message, history });
        return data;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        throw error;
    }
};

// This function talks to the enhanced AI chat endpoint with full regulator data
// Uses /ai/chat which includes: MRL limits, AMU thresholds, compliance stats, 
// WHO AWaRe classifications, and comprehensive system navigation mappings
export const sendMessageToGroq = async (message, history) => {
    try {
        // Call the enhanced AI endpoint that includes dynamic regulator context
        const { data } = await axiosInstance.post('/ai/chat', {
            message,
            conversationHistory: history
        });
        return data;
    } catch (error) {
        console.error("Error sending message to AI:", error);
        throw error;
    }
};