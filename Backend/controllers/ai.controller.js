// backend/controllers/ai.controller.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import Animal from '../models/animal.model.js';
import Treatment from '../models/treatment.model.js';
import { format } from 'date-fns';

// Add this right after your import statements
console.log("--- Environment Variable Check ---");
console.log("GEMINI_API_KEY Loaded:", !!process.env.GEMINI_API_KEY);
console.log("First 5 chars of Key:", process.env.GEMINI_API_KEY?.substring(0, 5));
console.log("---------------------------------");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateHealthTip = async (req, res) => {
    try {
        const { animalId } = req.body;
        const farmerId = req.user._id;

        // 1. Fetch the animal and its recent treatments
        const animal = await Animal.findOne({ _id: animalId, farmerId: farmerId });
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found or not owned by user.' });
        }

        const treatments = await Treatment.find({ animalId: animal.tagId, status: 'Approved' })
            .sort({ startDate: -1 })
            .limit(3);

        // 2. Create a concise summary of the animal's data for the AI
        let historySummary = 'No recent approved treatments on record.';
        if (treatments.length > 0) {
            historySummary = 'Recent Health History:\n' + treatments.map(t => 
                `- Treated for "${t.notes || t.drugName}" with ${t.drugName} on ${format(new Date(t.startDate), 'PPP')}.`
            ).join('\n');
        }

        const ageInYears = animal.dob ? new Date().getFullYear() - new Date(animal.dob).getFullYear() : 'Unknown';

        const contextForAI = `
            Animal Profile:
            - Species: ${animal.species}
            - Age: ${ageInYears} years
            - Gender: ${animal.gender}

            ${historySummary}
        `;

        // 3. Create the prompt and call the Gemini API
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); 
        const systemPrompt = `You are an expert veterinarian providing a single, proactive health tip for a farmer in India. The tip must be short (2-3 sentences max), practical, and based ONLY on the provided animal profile and its history. Do not repeat the history back to the user. Start your response directly with the tip.`;
        
        const fullPrompt = `${systemPrompt}\n\nDATA:\n${contextForAI}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const tip = response.text();

        res.json({ tip });

    } catch (error) {
        console.error("Error generating health tip:", error);
        res.status(500).json({ message: 'Failed to generate AI health tip.' });
    }
};