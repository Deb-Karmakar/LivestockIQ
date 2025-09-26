// backend/controllers/ai.controller.js

import { groq } from "../config/groq.js";
import Animal from "../models/animal.model.js";
import Treatment from "../models/treatment.model.js";
import { format } from "date-fns";

export const generateHealthTip = async (req, res) => {
  try {
    const { animalId } = req.body;
    const farmerId = req.user._id;

    // 1. Fetch animal
    const animal = await Animal.findOne({ _id: animalId, farmerId });
    if (!animal) {
      return res
        .status(404)
        .json({ message: "Animal not found or not owned by user." });
    }

    // 2. Fetch recent treatments
    const treatments = await Treatment.find({
      animalId: animal.tagId,
      status: "Approved",
    })
      .sort({ startDate: -1 })
      .limit(3);

    let historySummary = "No recent approved treatments on record.";
    if (treatments.length > 0) {
      historySummary =
        "Recent Health History:\n" +
        treatments
          .map(
            (t) =>
              `- Treated for "${t.notes || t.drugName}" with ${
                t.drugName
              } on ${format(new Date(t.startDate), "PPP")}.`
          )
          .join("\n");
    }

    const ageInYears = animal.dob
      ? new Date().getFullYear() - new Date(animal.dob).getFullYear()
      : "Unknown";

    const contextForAI = `
      Animal Profile:
      - Species: ${animal.species}
      - Age: ${ageInYears} years
      - Gender: ${animal.gender}

      ${historySummary}
    `;

    // 3. Build prompt
    const systemPrompt = `You are an expert veterinarian providing a single, proactive health tip for a farmer in India. 
    The tip must be short (2-3 sentences max), practical, and based ONLY on the provided animal profile and its history. 
    Do not repeat the history back to the user. Start your response directly with the tip.`;

    const fullPrompt = `${systemPrompt}\n\nDATA:\n${contextForAI}`;

    // 4. Call Groq (using LLaMA 3.1 or Mixtral)
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // or "mixtral-8x7b-instruct"
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.7,
      max_tokens: 200,
    });

    const tip = response.choices[0]?.message?.content?.trim();

    if (!tip) {
      console.error("❌ Groq returned no tip, sending fallback.");
      return res.json({
        tip: "Ensure your animals always have access to clean water, balanced feed, and regular health check-ups to prevent common illnesses.",
      });
    }

    res.json({ tip });
  } catch (error) {
    console.error("Error generating health tip:", error);
    res
      .status(500)
      .json({ message: "Failed to generate AI health tip from Groq." });
  }
};
