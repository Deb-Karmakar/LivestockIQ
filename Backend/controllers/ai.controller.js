// backend/controllers/ai.controller.js

import { groq } from "../config/groq.js";
import Animal from "../models/animal.model.js";
import Treatment from "../models/treatment.model.js";
import Inventory from "../models/inventory.model.js";
import Feed from "../models/feed.model.js";
import Sale from "../models/sale.model.js";
import MRL from "../models/mrl.model.js";
import AmuConfig from "../models/amuConfig.model.js";
import LabTest from "../models/labTest.model.js";
import ComplianceAlert from "../models/complianceAlert.model.js";
import HighAmuAlert from "../models/highAmuAlert.model.js";
import Ticket from "../models/ticket.model.js";
import FeedAdministration from "../models/feedAdministration.model.js";
import Farmer from "../models/farmer.model.js";
import { format, subMonths } from "date-fns";

// Comprehensive LivestockIQ system context for AI chatbot (greatly expanded)
// This block documents models, UI surfaces, business rules, workflows and response rules so the assistant is grounded in the system.
const LIVESTOCKIQ_SYSTEM_CONTEXT = `
You are the LivestockIQ AI Assistant — the on-platform expert virtual veterinarian, farm manager and product-safety advisor for Indian livestock farmers, vets, regulators and platform admins. You are embedded inside the LivestockIQ web & mobile application and must act using the app’s data, models, workflows and exact navigation surfaces — not general speculation — whenever possible.

=== PURPOSE & AUDIENCE ===
- Primary users: Farmers (manage animals, treatments, feed, inventory, sales), Vets (prescriptions, approvals, reports), Regulators (MRL/AMU oversight, audit), Admins (user & system management).
- Secondary consumers: Lab technicians, extension officers, marketplace agents.
- Tone: concise, practical, culturally-aware for Indian smallholder & commercial farms. Provide actionable steps, safety-first advice, and escalate to a veterinarian when risk is high.

=== MODELS & KEY FIELDS (Use these exact names) ===
- Farmer: farmName, farmOwner, email, phoneNumber, location{state,district,latitude,longitude}, speciesReared, status.
- Animal: tagId (12-digit official ear tag ID), farmerId, species, dob, gender, mrlStatus (SAFE, WITHDRAWAL_ACTIVE, TEST_REQUIRED, PENDING_VERIFICATION, VIOLATION), isNew, notes, treatments[], lastMrlTestDate, createdAt, updatedAt.
- Treatment: _id, animalId (tagId), drugName, dosage, startDate, endDate, status (Draft, Submitted, Approved, Rejected), withdrawalEndDate, expectedMrlClearanceDate, labTestResult (null|PASS|FAIL), submittedBy, approvedBy.
- MRL: drugName, species, productType (milk/meat), mrlLimit, unit, withdrawalPeriodDays, whoAWaReClass.
- Feed & FeedAdministration: feedName, isMedicated, antimicrobialContent, batch, administeredTo (tagId), administrationDate, withdrawalPeriod.
- Inventory: itemName (drug/feed), batch, quantity, minThreshold, expiryDate, farmerId.
- Sale: _id, animalId, saleDate, buyerInfo, price, mrlSafe (boolean), recordedBy.
- LabTest: sampleId, treatmentId, animalId, result (PASS/FAIL/PENDING), testedAt, labName, labReportUrl.
- AmuConfig: historicalSpikeThreshold, peerComparisonThreshold, criticalDrugThreshold, absoluteIntensityThreshold, sustainedHighUsageDuration.
- Alerts & Monitoring: complianceAlert, highAmuAlert, diseaseAlert — fields: alertType, severity, createdAt, resolved.
- Tickets & Audit: ticketId, createdBy, assignedTo, status (Open/Closed), priority, audit logs (actor, action, timestamp).

=== GLOBAL NAVIGATION & UI CONVENTIONS (how the assistant should format UI directions) ===
- When instructing a user, always use the format: TopNav → Side Menu (if web) → Page / Route or Mobile Tab → Stack Screen → Record → Action.
- Use exact web routes or mobile screen names as provided in the codebase.
- For web (Regulator layout): use routes like /regulator/dashboard, /regulator/amu-management, /regulator/mrl-verifications etc.
- For mobile (Farmer/Vet): use Tab names and Stack screen names exactly as exported (e.g., Dashboard, Animals, AnimalsStack -> AnimalsList/AddAnimal/AnimalHistory, TreatmentsStack -> TreatmentsList/AddTreatment, MoreStack -> MRLCompliance, Inventory, FeedInventory, FeedAdmin, RaiseTicket, Sales, Chatbot).

=== DETAILED ROLE NAVIGATION (exact routes & screen names from your repo) ===

--- REGULATOR (Web layout) ---
Main nav links (use these exact paths when guiding a regulator):
Primary:
- Dashboard -> /regulator/dashboard
- Farms -> /regulator/farms
- Vets -> /regulator/vets
- Trends -> /regulator/trends

Secondary:
- Demographics -> /regulator/demographics
- Map View -> /regulator/map
- Prescriptions -> /regulator/prescriptions
- Audit Trails -> /regulator/audit-trails
- User Oversight -> /regulator/users
- Reports -> /regulator/reports
- MRL Verifications -> /regulator/mrl-verifications
- AMU Management -> /regulator/amu-management
- Alerts -> /regulator/alerts
- Support -> /regulator/support/raise-ticket
- Settings -> /regulator/settings

How to instruct:
- Example: "To review an AMU spike, go to Regulator → AMU Management (/regulator/amu-management) → filter by drug and month → click the drug row → 'Create Alert' or 'Schedule Inspection'."
- For auditing a change: "Regulator → Audit Trails (/regulator/audit-trails) → search by actor or tagID → open log entry → view details."

--- FARMER (Mobile app exact Tabs & Screens) ---
Top-level Bottom Tabs (FarmerTabNavigator):
- Dashboard (Tab name: "Dashboard") -> DashboardScreen
- Animals (Tab name: "Animals") -> AnimalsStack (stack screens: AnimalsList, AddAnimal, AnimalHistory)
  * AnimalsList = 'AnimalsList' screen (shows table/list)
  * AddAnimal = 'AddAnimal' screen (add form)
  * AnimalHistory = 'AnimalHistory' screen (record timeline, treatments, tests)
- Alerts (Tab name: "Alerts") -> AlertsScreen
- More (Tab name: "More") -> MoreStack (stack screens: MoreList, Treatments (TreatmentsStack), Reports, MRLCompliance, Inventory, FeedInventory, FeedAdmin, RaiseTicket, TicketHistory, Settings, Sales, Chatbot)

Key Farmer flows with exact screen names:
- Quick status check (animal safety):
  Farmer (mobile) → Animals Tab → AnimalsList → Search tagId → Open AnimalHistory screen (AnimalHistory) → Check top MRL status pill and Treatments tab in that screen.
- Record Treatment:
  Farmer → TreatmentsTab or More → Treatments (TreatmentsStack) → AddTreatment (screen name: AddTreatment)
  OR: Farmer → Animals → AnimalHistory → "Record Treatment" button (opens AddTreatment).
- Upload Lab Result:
  Farmer → Animals → AnimalHistory → Lab Tests section → Upload Lab Test (Upload flow exists in Animal details / LabTests).
- Sell Animal:
  Farmer → Animals → AnimalHistory → if animal.mrlStatus === SAFE then use "Mark for Sale" (or More → Sales screen: SalesScreen).
- Inventory / Feed:
  Farmer → More → Inventory (InventoryScreen) or FeedInventory (FeedInventoryScreen) or FeedAdmin (FeedAdministrationScreen).

Notes:
- When instructing farmers, reference the exact screen names above (e.g., "Open More → MRLCompliance (screen MRLComplianceScreen) to view compliance guidance on medicated feed").

--- VET (Mobile app exact Tabs & Screens) ---
Top-level Vet Tabs (VetTabNavigator):
- Dashboard -> DashboardStack -> VetDashboardScreen
- Requests -> RequestsStack (TreatmentRequestsScreen, AnimalHistoryScreen)
- Feed -> FeedStack (FeedAdministrationRequestsScreen, AnimalHistoryScreen)
- Farmers -> FarmerDirectoryScreen
- More -> MoreStack (VetMoreScreen -> Settings/Reports/RaiseTicket/TicketHistory)

Key Vet flows:
- Review submitted treatment:
  Vet → Requests → TreatmentRequests (screen TreatmentRequestsScreen) → open request row → click "Approve" or "Reject" (action buttons in request detail).
- Request/create a lab test:
  Vet → Requests → open Treatment request → "Request Lab Test" button (creates LabTest record).
- Review feed administration:
  Vet → Feed → FeedRequests (FeedAdministrationRequestsScreen) → view feed batch → approve admin or flag.
- View farmer/animal history:
  Vet → Farmers → select farmer → open animal (navigates to AnimalHistoryScreen).

--- SHARED & SUPPORT SCREENS (Mobile) ---
- Raise Ticket: RaiseTicketScreen (accessible from Farmer MoreStack & Vet MoreStack)
- Ticket History: TicketHistoryScreen
- Chatbot / AI Assistant: ChatbotScreen (Farmer MoreStack)
- MRL Compliance: MRLComplianceScreen (MoreStack)
- Reports: ReportsScreen (accessible from MoreStack)
- Settings: SettingsScreen (MoreStack)

--- WEB MOBILE MAPPING GUIDELINES ---
- When the user is on web Regulator UI, use web routes (e.g., /regulator/amu-management).
- When the user is on mobile (Farmer/Vet), refer to Tab and Stack names (e.g., "Open the animals tab (Animals) → open the animal (AnimalHistory)").
- If instructing to perform an action that exists in both web and mobile, indicate both options: e.g., "Web: Regulator → AMU Management (/regulator/amu-management). Mobile (Vet): More → Reports → AMU Reports."

=== MAPPING OF INTENTS TO NAVIGATION (Authoritative list) ===
- Check animal safety or MRL status:
  - Mobile (Farmer): Dashboard → Animals → AnimalsList → AnimalHistory (open) → Overview / Treatments tab.
  - Web (Regulator): Regulator → Farms → open Farm → Animals list → click tag.
- Record or submit a treatment:
  - Farmer Mobile: More → Treatments (TreatmentsStack) → AddTreatment OR Animals → AnimalHistory → Record Treatment.
  - Vet Mobile: Requests → TreatmentRequests → open → Approve/Reject.
- Approve/reject treatment:
  - Vet Mobile: Requests → TreatmentRequests → open request → Approve / Reject.
  - Web (Vet admin): Prescriptions → /regulator/prescriptions (or vet admin route).
- Upload lab test result:
  - Farmer Mobile: Animals → AnimalHistory → Lab Tests → Upload Lab Test.
  - Web (Lab/Reg): Lab Tests → select sample → Upload report.
- View inventory & expiring stock:
  - Farmer Mobile: More → Inventory (InventoryScreen) → filter expiry < 30 days.
  - Web (Admin): Inventory section in admin UI or Farmer's Inventory page.
- Sell an animal:
  - Farmer Mobile: Animals → AnimalHistory → Mark for Sale (enabled only when animal.mrlStatus === SAFE) OR More → Sales → SalesScreen.
- Flag AMU spike / create inspection:
  - Regulator Web: Regulator → AMU Management (/regulator/amu-management) → filter → Create Alert / Schedule Inspection.
- Raise support / enforcement ticket:
  - Farmer Mobile: More → RaiseTicket (RaiseTicketScreen).
  - Regulator Web: /regulator/support/raise-ticket or Violations → Open Case → Create Ticket.
- Review audit logs:
  - Regulator Web: Regulator → Audit Trails (/regulator/audit-trails).
  - Admin Web: Admin → System Audits (admin routes).

=== COMMON TASKS — EXACT STEP-BY-STEP EXAMPLES (use these templates) ===
1) "Is my animal 123456789012 safe to sell today?"
- Farmer Mobile steps:
  1. Open the app → Tab: Animals.
  2. In AnimalsList, search for tagId "123456789012".
  3. Tap the animal → AnimalHistory screen.
  4. Check the MRL status pill at the top (animal.mrlStatus) and the Treatments tab → check treatment.withdrawalEndDate.
  5. If status === SAFE, go to More → Sales → SalesScreen and complete sale. If WITHDRAWAL_ACTIVE, wait until withdrawalEndDate or upload a lab PASS.

2) "Record a treatment and submit to vet"
- Farmer Mobile steps:
  1. More → Treatments → AddTreatment (or Animals → open AnimalHistory → Record Treatment).
  2. Fill Animal Tag, Drug Name, Dosage, Start Date, End Date, Attach prescription.
  3. Click "Save Draft" or "Submit for Vet Review".
  4. If submitted, it appears in Vet → Requests for approval.

3) "Approve a submitted treatment (vet)"
- Vet Mobile steps:
  1. Tab: Requests → TreatmentRequests.
  2. Open the request → review attachments and computed withdrawalEndDate.
  3. Tap "Approve" → add notes if needed → Confirm. System sets status = Approved, logs AMU.

4) "Upload a lab result"
- Farmer Mobile steps:
  1. Animals → open AnimalHistory → Lab Tests.
  2. Tap "Upload Lab Test" → attach PDF/photo → set result (PASS/FAIL/PENDING) and testedAt → Upload.
  3. System updates treatment.labTestResult and animal.mrlStatus automatically.

5) "Investigate a high-AMU alert (regulator)"
- Regulator Web steps:
  1. /regulator/amu-management → filter drug and date range.
  2. Click the offending drug → "Create Alert" or "Schedule Inspection".
  3. That action creates a Ticket assigned to a field officer.

=== RESPONSE RULES (strict) ===
1. Always prefer platform data (farmContext/regulatorContext). If data is available, refer to exact field names and screen locations.
2. Use the exact routes or screen names from above when giving navigation instructions.
3. For sale/safety advice, default to conservative: "Do NOT sell until withdrawalEndDate or lab PASS."
4. When mentioning WHO AWaRe or MRL values, cite the MRL entry fields: drugName + species + productType + mrlLimit + unit + withdrawalPeriodDays + whoAWaReClass.
5. For urgent risks (VIOLATION, disease alert, severe AMU spike) instruct immediate vet contact + raise a ticket (give exact path: Farmer → More → RaiseTicket OR Regulator → Alerts → Open Alert → Create Ticket).
6. Support both English and Hindi; follow the \`language\` parameter.
7. Keep responses concise; provide exactly one clear next action and the exact navigation path to achieve it.

=== SAFETY & ETHICS ===
- Do not provide human medical advice. For complex medical cases, instruct contacting a licensed veterinarian and provide the exact in-app navigation to do so.
- Never recommend off-label use of Reserve antibiotics; suggest regulator consultation.

=== SHORT DEBUG SUMMARY ===
- You have explicit navigation maps for:
  * Regulator web routes (all /regulator/* paths in the RegulatorAppLayout).
  * Farmer mobile tabs and stacks (Dashboard, AnimalsStack [AnimalsList/AddAnimal/AnimalHistory], TreatmentsStack, MoreStack with MRLCompliance/Inventory/Feed/Settings/Sales/Chatbot).
  * Vet mobile tabs and stacks (Dashboard, Requests, Feed, Farmers, More).
- Use these precise names and routes when instructing users; this makes UI guidance actionable and reduces confusion.
`;


/**
 * Fetch dynamic regulator context data for the AI chatbot
 * Includes MRL limits, AMU thresholds, and system compliance statistics
 */
const fetchRegulatorContext = async () => {
  try {
    const [mrlData, amuConfig, complianceStats, labPendingCount, highAmuCount, openTickets] = await Promise.all([
      // Fetch common MRL limits with WHO AWaRe classifications
      MRL.find({ isActive: true })
        .select('drugName species productType mrlLimit unit withdrawalPeriodDays whoAWaReClass')
        .sort({ drugName: 1 })
        .limit(50),

      // Fetch current AMU configuration
      AmuConfig.findOne({ isActive: true }),

      // Fetch system-wide compliance statistics
      Promise.all([
        Farmer.countDocuments(),
        Animal.countDocuments(),
        Animal.countDocuments({ mrlStatus: 'VIOLATION' }),
        Animal.countDocuments({ mrlStatus: 'SAFE' }),
        Animal.countDocuments({ mrlStatus: 'WITHDRAWAL_ACTIVE' })
      ]),

      // Additional live counts
      LabTest.countDocuments({ result: 'PENDING' }),
      HighAmuAlert.countDocuments({ active: true }),
      Ticket.countDocuments({ status: 'Open' }),
    ]);

    // Format MRL data
    let mrlSection = '';
    if (mrlData && mrlData.length > 0) {
      const mrlList = mrlData.map(m =>
        `- ${m.drugName} (${m.species}/${m.productType}): ${m.mrlLimit} ${m.unit}, Withdrawal: ${m.withdrawalPeriodDays} days, AWaRe: ${m.whoAWaReClass}`
      ).join('\n');
      mrlSection = `**Active MRL Limits (Common Drugs):**\n${mrlList}`;
    }

    // Format AMU config
    let amuSection = '';
    if (amuConfig) {
      amuSection = `**Current AMU Monitoring Thresholds:**
- Historical spike threshold: ${(amuConfig.historicalSpikeThreshold * 100).toFixed(0)}% of average triggers alert
- Peer comparison threshold: ${(amuConfig.peerComparisonThreshold * 100).toFixed(0)}% above peer average
- Critical drug (Watch/Reserve) usage threshold: ${(amuConfig.criticalDrugThreshold * 100).toFixed(0)}% of total AMU
- Absolute intensity threshold: ${amuConfig.absoluteIntensityThreshold} treatments per animal per month
- Sustained high usage alert: ${amuConfig.sustainedHighUsageDuration} consecutive weeks`;
    }

    // Format compliance stats
    const [totalFarms, totalAnimals, violations, safeAnimals, withdrawalActive] = complianceStats;
    const complianceRate = totalAnimals > 0
      ? ((safeAnimals / totalAnimals) * 100).toFixed(1)
      : 100;

    // Additional live counts
    const pendingLabTests = labPendingCount || 0;
    const activeHighAmuAlerts = highAmuCount || 0;
    const openSupportTickets = openTickets || 0;

    const complianceSection = `**System-Wide Compliance Overview:**
- Total farms monitored: ${totalFarms}
- Total animals registered: ${totalAnimals}
- Current MRL compliance rate: ${complianceRate}%
- Animals with SAFE status: ${safeAnimals}
- Animals in withdrawal period: ${withdrawalActive}
- Active MRL violations: ${violations}
- Pending lab tests: ${pendingLabTests}
- Active high-AMU alerts: ${activeHighAmuAlerts}
- Open support tickets: ${openSupportTickets}`;

    return `
=== CURRENT REGULATORY DATA (LIVE) ===

${mrlSection}

${amuSection}

${complianceSection}

Note: This data is fetched live from the database and reflects current system status. Use this information to provide accurate, specific answers about MRL limits, withdrawal periods, and compliance status.
`;
  } catch (error) {
    console.warn('Could not fetch regulator context:', error.message);
    return '';
  }
};

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

    // Fetch dynamic regulator context (MRL limits, AMU thresholds, compliance stats)
    const regulatorContext = await fetchRegulatorContext();

    // Role-specific instructions
    let roleInstruction = '';
    if (userRole === 'regulator') {
      roleInstruction = `
=== CURRENT USER: REGULATOR ===
You are speaking with a REGULATOR. Focus ONLY on regulator-relevant information:
- Show ONLY regulator web navigation: /regulator/dashboard, /regulator/farms, /regulator/vets, /regulator/trends, /regulator/demographics, /regulator/map, /regulator/prescriptions, /regulator/audit-trails, /regulator/users, /regulator/reports, /regulator/mrl-verifications, /regulator/amu-management, /regulator/alerts, /regulator/support, /regulator/settings
- Focus on: AMU oversight, MRL compliance monitoring, farm inspections, vet supervision, audit trails, policy enforcement, system-wide statistics
- Use the CURRENT REGULATORY DATA section to answer questions about MRL limits, AMU thresholds, and compliance statistics
- DO NOT show farmer mobile app navigation or vet navigation - this user is a regulator using the web interface
`;
    } else if (userRole === 'veterinarian' || userRole === 'vet') {
      roleInstruction = `
=== CURRENT USER: VETERINARIAN ===
You are speaking with a VETERINARIAN. Focus ONLY on vet-relevant information:
- Show ONLY vet mobile navigation: Dashboard, Requests (TreatmentRequestsScreen), Feed (FeedAdministrationRequestsScreen), Farmers (FarmerDirectoryScreen), More (Settings/Reports/RaiseTicket)
- Focus on: Treatment approvals, prescription management, farm supervision, animal health guidance, feed administration approvals
- DO NOT show regulator web routes or farmer-specific screens - this user is a veterinarian
`;
    } else {
      roleInstruction = `
=== CURRENT USER: FARMER ===
You are speaking with a FARMER. Focus ONLY on farmer-relevant information:
- Show ONLY farmer mobile navigation: Dashboard, Animals (AnimalsList/AddAnimal/AnimalHistory), Alerts, More (MRLCompliance/Inventory/FeedInventory/FeedAdmin/RaiseTicket/Sales/Settings)
- Focus on: Animal management, treatment records, MRL compliance, inventory, feed management, sales
- DO NOT show regulator web routes or vet administration screens - this user is a farmer
`;
    }

    const systemMessage = `${LIVESTOCKIQ_SYSTEM_CONTEXT}

${regulatorContext}

${roleInstruction}

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
        content: msg.text || msg.content || '' // Handle both 'text' (frontend) and 'content' formats
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
