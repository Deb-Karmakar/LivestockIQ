// Mobile/src/services/aiService.js
import api from './api';

export const getAnimalHealthTip = async (animalId) => {
    try {
        const { data } = await api.post('/ai/health-tip', { animalId });
        return data; // Returns { tip: "..." }
    } catch (error) {
        console.error('Error fetching AI health tip:', error);
        throw error;
    }
};

/**
 * Send a chat message to the AI assistant
 * @param {string} message - User's message
 * @param {string} language - 'en' or 'hi'
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<{response: string, language: string}>}
 */
export const sendChatMessage = async (message, language = 'en', conversationHistory = []) => {
    try {
        const { data } = await api.post('/ai/chat', {
            message,
            language,
            conversationHistory
        });
        return data; // Returns { response: "...", language: "..." }
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

/**
 * Synthesize speech using Google Cloud TTS
 * @param {string} text - Text to speak
 * @param {string} language - 'en' or 'hi'
 * @returns {Promise<{audio: string, contentType: string}>}
 */
export const synthesizeSpeech = async (text, language = 'en') => {
    try {
        const { data } = await api.post('/tts/synthesize', { text, language });
        return data; // Returns { audio: "base64...", contentType: "audio/mp3" }
    } catch (error) {
        console.error('Error synthesizing speech:', error);
        throw error;
    }
};
