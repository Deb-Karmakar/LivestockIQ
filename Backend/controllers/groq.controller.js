// backend/controllers/groq.controller.js

import Groq from 'groq-sdk';
import { generateSystemPrompt } from '../utils/promptGenerator.js'; // We'll move the prompt logic here

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const handleGroqChat = async (req, res) => {
    try {
        const { message, history } = req.body;
        const user = req.user;

        if (!message) {
            return res.status(400).json({ message: 'Message is required.' });
        }
        
        // 1. Get the detailed system prompt for the user's role
        const systemPrompt = generateSystemPrompt(user);

        // 2. Format the history and current message for Groq
        const messagesForAPI = [
            { role: "system", content: systemPrompt },
            // Map your existing history to the format Groq expects
            ...history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.text
            })),
            { role: "user", content: message }
        ];
        
        // 3. Call the Groq API
        const chatCompletion = await groq.chat.completions.create({
            messages: messagesForAPI,
            model: "llama-3.1-8b-instant", // Use a fast and capable model
            temperature: 0.7,
            max_tokens: 1024,
        });

        const reply = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't get a response.";

        res.json({ reply });

    } catch (error) {
        console.error("Error in Groq chat handler:", error);
        res.status(500).json({ message: 'Failed to get response from Groq.' });
    }
};