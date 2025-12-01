// backend/controllers/ai.controller.js

import { groq } from "../config/groq.js";
import Animal from "../models/animal.model.js";
import Treatment from "../models/treatment.model.js";
import { format, subMonths } from "date-fns";

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
              `- Treated for "${t.notes || t.drugName}" with ${t.drugName
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

export const generateRegulatorInsights = async (req, res) => {
  try {
    const twelveMonthsAgo = subMonths(new Date(), 12);

    // 1. Fetch Trend Data (Reusing logic from regulator.controller.js)
    const [amuByDrugRaw, amuBySpeciesRaw] = await Promise.all([
      Treatment.aggregate([
        { $match: { status: 'Approved', startDate: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$startDate' },
              month: { $month: '$startDate' },
              drugName: '$drugName'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Treatment.aggregate([
        { $match: { status: 'Approved', startDate: { $gte: twelveMonthsAgo } } },
        {
          $lookup: {
            from: 'animals',
            localField: 'animalId',
            foreignField: 'tagId',
            as: 'animalInfo'
          }
        },
        { $unwind: '$animalInfo' },
        {
          $group: {
            _id: {
              year: { $year: '$startDate' },
              month: { $month: '$startDate' },
              species: '$animalInfo.species'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // 2. Format Data for AI
    const drugSummary = amuByDrugRaw.map(d =>
      `${d._id.drugName} (${d._id.month}/${d._id.year}): ${d.count}`
    ).join(', ');

    const speciesSummary = amuBySpeciesRaw.map(s =>
      `${s._id.species} (${s._id.month}/${s._id.year}): ${s.count}`
    ).join(', ');

    const contextForAI = `
      AMU by Drug (Last 12 Months): ${drugSummary}
      AMU by Species (Last 12 Months): ${speciesSummary}
    `;

    // 3. Build Prompt
    const systemPrompt = `You are an expert veterinary epidemiologist and regulatory advisor. 
    Analyze the provided Antimicrobial Usage (AMU) data. 
    Identify key trends, potential resistance risks (e.g., spikes in specific drugs), and provide 3 actionable recommendations for the regulator.
    Format your response in Markdown with headers: ## Key Trends, ## Risk Assessment, ## Recommendations.`;

    const fullPrompt = `${systemPrompt}\n\nDATA:\n${contextForAI}`;

    // 4. Call Groq
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const insights = response.choices[0]?.message?.content?.trim();

    if (!insights) {
      return res.json({ insights: "Unable to generate insights at this time." });
    }

    res.json({ insights });

  } catch (error) {
    console.error("Error generating regulator insights:", error);
    res.status(500).json({ message: "Failed to generate AI insights." });
  }
};

export const generateDemographicsInsights = async (req, res) => {
  try {
    // 1. Fetch Summary Data
    const [speciesCount, regionalCount, mrlStats] = await Promise.all([
      // Species Distribution
      Animal.aggregate([
        { $group: { _id: '$species', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Regional Distribution (State level for summary)
      Animal.aggregate([
        {
          $lookup: {
            from: 'farmers',
            localField: 'farmerId',
            foreignField: '_id',
            as: 'farmInfo'
          }
        },
        { $unwind: '$farmInfo' },
        {
          $group: {
            _id: '$farmInfo.location.state',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      // MRL Compliance Status
      Animal.aggregate([
        { $group: { _id: '$mrlStatus', count: { $sum: 1 } } }
      ])
    ]);

    // 2. Format Data for AI
    const speciesSummary = speciesCount.map(s => `${s._id}: ${s.count}`).join(', ');
    const regionalSummary = regionalCount.map(r => `${r._id || 'Unknown Region'}: ${r.count}`).join(', ');

    // Calculate compliance % for context
    let totalAnimals = 0;
    let compliantAnimals = 0;
    const mrlSummary = mrlStats.map(m => {
      const status = m._id || 'SAFE';
      const count = m.count;
      totalAnimals += count;
      if (status === 'SAFE' || status === 'NEW') compliantAnimals += count;
      return `${status}: ${count}`;
    }).join(', ');

    const complianceRate = totalAnimals > 0 ? ((compliantAnimals / totalAnimals) * 100).toFixed(1) : 100;

    const contextForAI = `
      Total Animals: ${totalAnimals}
      Species Distribution: ${speciesSummary}
      Regional Distribution: ${regionalSummary}
      MRL Status Breakdown: ${mrlSummary}
      Overall MRL Compliance Rate: ${complianceRate}%
    `;

    // 3. Build Prompt
    const systemPrompt = `You are an expert veterinary epidemiologist and policy advisor.
    Analyze the provided livestock demographics and MRL compliance data.
    Identify key observations regarding the animal population structure, regional concentration, and safety compliance.
    Provide 3 strategic recommendations for the regulator to improve monitoring or support specific regions/sectors.
    Format your response in Markdown with headers: ## Population Analysis, ## Compliance Assessment, ## Strategic Recommendations.`;

    const fullPrompt = `${systemPrompt}\n\nDATA:\n${contextForAI}`;

    // 4. Call Groq
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const insights = response.choices[0]?.message?.content?.trim();

    if (!insights) {
      return res.json({ insights: "Unable to generate insights at this time." });
    }

    res.json({ insights });

  } catch (error) {
    console.error("Error generating demographics insights:", error);
    res.status(500).json({ message: "Failed to generate AI insights." });
  }
};
