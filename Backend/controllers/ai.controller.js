// backend/controllers/ai.controller.js

import { groq } from "../config/groq.js";
import Animal from "../models/animal.model.js";
import Treatment from "../models/treatment.model.js";
import Inventory from "../models/inventory.model.js";
import Feed from "../models/feed.model.js";
import Sale from "../models/sale.model.js";
import { format, subMonths } from "date-fns";

// Comprehensive LivestockIQ system context for AI chatbot
const LIVESTOCKIQ_SYSTEM_CONTEXT = `
You are the LivestockIQ AI Assistant - an expert virtual veterinarian and farm management advisor for Indian livestock farmers.

=== ABOUT LIVESTOCKIQ ===
LivestockIQ is a comprehensive farm management platform designed for Indian livestock farmers. It helps manage:
1. Animal Management: Track cattle, goats, sheep, pigs, poultry, and buffalo with 12-digit official ear tag IDs
2. Treatment Records: Veterinarian-approved treatment tracking with drug withdrawal periods
3. MRL (Maximum Residue Limit) Compliance: Ensures meat and milk products are safe for human consumption
4. Feed Management: Track medicated and non-medicated feed with antimicrobial content
5. Drug Inventory: Manage veterinary medicine stock with expiry tracking
6. Sales Management: Record sale transactions for animals with safe MRL status
7. Lab Testing: Upload and track residue test results from certified laboratories
8. AMU (Antimicrobial Usage) Monitoring: Track antibiotic usage following WHO AWaRe classification

=== KEY CONCEPTS ===

**MRL Status (Maximum Residue Limit):**
- SAFE: Animal products can be sold safely
- WITHDRAWAL_ACTIVE: Animal is under drug withdrawal period - DO NOT SELL products
- TEST_REQUIRED: Lab test needed to verify safety
- PENDING_VERIFICATION: Waiting for lab test verification
- VIOLATION: Residue levels exceeded safe limits

**WHO AWaRe Drug Classification:**
- Access: First-line antibiotics with lower resistance risk (preferred)
- Watch: Higher resistance potential, use with caution
- Reserve: Last-resort antibiotics for multi-drug resistant infections (avoid unless critical)

**Withdrawal Period:**
The mandatory waiting time after administering a drug before animal products (milk/meat) can be sold for consumption.

**Feed Types:**
- Medicated Feed: Contains antimicrobials, requires vet prescription, has withdrawal period
- Non-Medicated Feed: Regular feed without antimicrobials (Starter, Grower, Finisher, Layer, Breeder)

=== HOW TO HELP USERS ===

You can help farmers with:
1. **Treatment Questions**: Explain withdrawal periods, drug interactions, dosage guidelines
2. **MRL Compliance**: Explain when animals are safe for sale, what tests are needed
3. **Feed Management**: Advise on medicated vs non-medicated feed, proper feeding schedules
4. **Animal Health**: Provide general health tips for different species (cattle, goat, sheep, etc.)
5. **Inventory Management**: Help track medicine stock and expiry
6. **Regulatory Compliance**: Explain FSSAI regulations, proper record-keeping
7. **Disease Prevention**: Vaccination schedules, biosecurity measures
8. **Sales Guidance**: When products are safe to sell based on MRL status

=== RESPONSE GUIDELINES ===
1. Be concise but thorough - farmers are busy
2. Use practical, actionable advice
3. Always prioritize animal welfare and food safety
4. Recommend consulting a veterinarian for serious health issues
5. Be culturally sensitive to Indian farming practices
6. Support both English and Hindi languages based on user preference
7. When discussing drugs, mention the WHO AWaRe classification if relevant
8. Always emphasize the importance of completing withdrawal periods before selling products
`;

/**
 * AI Chatbot endpoint - Interactive conversation with LivestockIQ AI Assistant
 */
export const chat = async (req, res) => {
  try {
    const { message, language = 'en', conversationHistory = [] } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role || 'farmer';

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Fetch user's farm context for personalized responses
    let farmContext = '';
    try {
      const [animalCount, activeWithdrawals, lowStockItems, recentSales] = await Promise.all([
        Animal.countDocuments({ farmerId: userId }),
        Treatment.countDocuments({
          farmerId: userId,
          status: 'Approved',
          withdrawalEndDate: { $gt: new Date() }
        }),
        Inventory.countDocuments({
          farmerId: userId,
          expiryDate: { $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        }),
        Sale.countDocuments({
          farmerId: userId,
          saleDate: { $gte: subMonths(new Date(), 1) }
        })
      ]);

      const animalsByStatus = await Animal.aggregate([
        { $match: { farmerId: userId } },
        { $group: { _id: '$mrlStatus', count: { $sum: 1 } } }
      ]);

      const statusSummary = animalsByStatus.map(s => `${s._id}: ${s.count}`).join(', ');

      farmContext = `
USER'S FARM CONTEXT:
- Total Animals: ${animalCount}
- Animals by MRL Status: ${statusSummary || 'No animals yet'}
- Active Withdrawal Treatments: ${activeWithdrawals}
- Medicines Expiring Soon: ${lowStockItems}
- Sales in Last 30 Days: ${recentSales}
`;
    } catch (err) {
      console.warn('Could not fetch farm context:', err.message);
      farmContext = 'USER\'S FARM CONTEXT: Unable to fetch - user may be new.';
    }

    // Build conversation messages
    const languageInstruction = language === 'hi'
      ? 'IMPORTANT: Respond in Hindi (हिंदी). Use Devanagari script.'
      : 'Respond in English.';

    const systemMessage = `${LIVESTOCKIQ_SYSTEM_CONTEXT}

${farmContext}

${languageInstruction}

Current Date: ${format(new Date(), 'PPP')}
User Role: ${userRole}
`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemMessage }
    ];

    // Add previous conversation history (limit to last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call Groq AI
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiResponse = response.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      const fallback = language === 'hi'
        ? 'क्षमा करें, मैं अभी जवाब नहीं दे पा रहा हूं। कृपया पुनः प्रयास करें।'
        : 'Sorry, I could not generate a response. Please try again.';
      return res.json({ response: fallback });
    }

    res.json({
      response: aiResponse,
      language: language
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ message: 'Failed to process chat message' });
  }
};

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
    The tip must be short(2 - 3 sentences max), practical, and based ONLY on the provided animal profile and its history. 
    Do not repeat the history back to the user.Start your response directly with the tip.`;

    const fullPrompt = `${systemPrompt} \n\nDATA: \n${contextForAI} `;

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
      `${d._id.drugName} (${d._id.month}/${d._id.year}): ${d.count} `
    ).join(', ');

    const speciesSummary = amuBySpeciesRaw.map(s =>
      `${s._id.species} (${s._id.month}/${s._id.year}): ${s.count} `
    ).join(', ');

    const contextForAI = `
      AMU by Drug(Last 12 Months): ${drugSummary}
      AMU by Species(Last 12 Months): ${speciesSummary}
      `;

    // 3. Build Prompt
    const systemPrompt = `You are an expert veterinary epidemiologist and regulatory advisor. 
    Analyze the provided Antimicrobial Usage(AMU) data. 
    Identify key trends, potential resistance risks(e.g., spikes in specific drugs), and provide 3 actionable recommendations for the regulator.
    Format your response in Markdown with headers: ## Key Trends, ## Risk Assessment, ## Recommendations.`;

    const fullPrompt = `${systemPrompt} \n\nDATA: \n${contextForAI} `;

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
    const speciesSummary = speciesCount.map(s => `${s._id}: ${s.count} `).join(', ');
    const regionalSummary = regionalCount.map(r => `${r._id || 'Unknown Region'}: ${r.count} `).join(', ');

    // Calculate compliance % for context
    let totalAnimals = 0;
    let compliantAnimals = 0;
    const mrlSummary = mrlStats.map(m => {
      const status = m._id || 'SAFE';
      const count = m.count;
      totalAnimals += count;
      if (status === 'SAFE' || status === 'NEW') compliantAnimals += count;
      return `${status}: ${count} `;
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
        Provide 3 strategic recommendations for the regulator to improve monitoring or support specific regions / sectors.
    Format your response in Markdown with headers: ## Population Analysis, ## Compliance Assessment, ## Strategic Recommendations.`;

    const fullPrompt = `${systemPrompt} \n\nDATA: \n${contextForAI} `;

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
