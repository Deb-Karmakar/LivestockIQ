// frontend/src/components/ChatWidget.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Loader2 } from 'lucide-react';

// Helper function to generate the detailed "cheat sheet" for the AI
const generateSystemPrompt = (user) => {
    const baseRules = `
        You are 'IQ Buddy', an expert AI assistant for the LivestockIQ application.
        LivestockIQ is a digital platform for farmers, veterinarians, and regulators in India to manage animal health records.
        Your goal is to answer clearly, guide users to the right features, and promote best practices in livestock management.
        Keep responses concise, helpful, and encouraging.

        VERY IMPORTANT FORMATTING RULES:
        - Do NOT use Markdown. Do not use asterisks for bolding.
        - To emphasize text, wrap text in <b> and </b>.
        - Use simple hyphen bullets (-) for lists.
        - Start each bullet on a new line.
    `;

    // A comprehensive knowledge base for LivestockIQ
    const LIVESTOCKIQ_KB = `
        LIVESTOCKIQ KNOWLEDGE BASE

        Mission and Core Idea:
        - LivestockIQ digitizes livestock health records to improve compliance, animal welfare, and farm productivity in India.
        - Creates a transparent, traceable system connecting farmers, veterinarians, and regulators.
        - Ensures proper antimicrobial use (AMU) oversight and food safety compliance.

        Core User Flow:
        - A <b>Farmer</b> logs animal details and creates treatment records for their livestock.
        - Their supervising <b>Veterinarian</b> receives a notification, reviews the treatment, adds professional notes, and digitally approves it.
        - An official prescription is then automatically emailed to the farmer as a PDF.
        - A <b>Regulator</b> can view aggregated, anonymized data (trends, demographics, heatmaps) for regional oversight.

        Key Features:
        - Multi-Role System: Tailored dashboards and features for Farmers, Veterinarians, and Regulators with role-based access control.
        - Animal Management: Farmers can log individual animal details (tagId, species, date of birth, breed information).
        - Treatment Logging: Farmers create detailed records of treatments including drug name, dosage, administration date, and reason.
        - Veterinary Verification: Vets can approve/reject treatment requests, add official notes, and set withdrawal periods for food safety.
        - Automated Prescriptions: On approval, a professional PDF prescription is automatically generated and emailed to the farmer.
        - Sales Logging: Farmers can log sales of animal products (milk, meat, eggs) only after withdrawal periods are completed.
        - Inventory Management: Farmers can track their stock of veterinary drugs and medicines with expiry date monitoring.
        - Animal History Timeline: Complete, chronological view of an animal's lifecycle (birth, treatments, vaccinations, sales).
        - Compliance Tracking: System ensures farmers follow proper withdrawal periods before product sales.
        - Regulator Dashboards: High-level views of regional AMU trends, compliance rates, and geospatial heatmaps for policy decisions.
        - Notification System: Real-time alerts for treatment approvals, withdrawal period completions, and compliance issues.
        - AI Chatbot: You, 'IQ Buddy', provide role-aware assistance using advanced AI capabilities.

        Technical Stack:
        - Core Stack: <b>MERN</b> (MongoDB, Express.js, React.js, Node.js).
        - Frontend: React with Vite for fast development; Tailwind CSS for styling; shadcn/ui components for modern UI.
        - Data Visualization: Recharts for analytics charts and graphs; react-leaflet for interactive maps.
        - Backend: Node.js + Express REST API; MongoDB with Mongoose ODM.
        - Authentication: JWT-based secure authentication with role-based access.
        - Email Service: Automated PDF generation and email delivery for prescriptions.
        - File Management: PDF generation for prescriptions and reports.

        Benefits by Role:
        - For Farmers:
          - Digital record keeping replaces paper-based systems.
          - Automated compliance tracking prevents violations.
          - Easy inventory management and treatment history access.
          - Professional prescriptions improve animal care quality.
        - For Veterinarians:
          - Streamlined treatment review and approval process.
          - Digital prescription generation saves time.
          - Better oversight of farmer compliance.
          - Professional liability protection through documented approvals.
        - For Regulators:
          - Real-time visibility into regional AMU patterns.
          - Data-driven policy making capabilities.
          - Improved food safety oversight.
          - Compliance monitoring without individual farm intrusion.

        Compliance and Safety Features:
        - Withdrawal period enforcement prevents premature product sales.
        - Drug inventory tracking ensures proper usage.
        - Veterinary approval required for all treatments.
        - Audit trails for regulatory inspections.
        - Anonymous data aggregation protects farmer privacy while enabling oversight.

        Best Practices Promoted:
        - Responsible antimicrobial use to prevent resistance.
        - Proper veterinary oversight of treatments.
        - Accurate record keeping for traceability.
        - Food safety compliance through withdrawal period adherence.
        - Preventive healthcare through vaccination tracking.

        Future Scope:
        - Integration with government veterinary databases.
        - Mobile app for offline functionality in rural areas.
        - AI-powered treatment recommendations based on animal history.
        - Blockchain integration for immutable record keeping.
        - IoT device integration for automated health monitoring.
    `;

    // Role-aware guidance to tailor responses
    let roleContext = `
        The user is a GUEST (not logged in).
        - They can view general information about LivestockIQ.
        - To access farm management features, they need to register as a Farmer, Veterinarian, or Regulator.
        - Encourage appropriate registration based on their needs.
    `;

    if (user && user.role) {
        switch (user.role) {
            case "farmer":
                roleContext = `
                    The user is a FARMER.
                    - Animal Management: Add, edit, and view their livestock details including tag IDs, species, breeds, and birth dates.
                    - Treatment Logging: Create treatment records specifying drug, dosage, date, and reason; these require veterinary approval.
                    - Inventory Tracking: Monitor veterinary drug stock levels and expiry dates.
                    - Sales Logging: Record product sales (milk, meat, eggs) but only after withdrawal periods are completed.
                    - History Viewing: Access complete timeline of each animal's treatments, vaccinations, and sales.
                    - Prescription Management: Receive approved prescriptions via email as PDF documents.
                    - Compliance: Follow withdrawal periods and veterinary guidance for food safety.
                `;
                break;
            case "veterinarian":
                roleContext = `
                    The user is a VETERINARIAN.
                    - Treatment Review: Review and approve/reject treatment requests from farmers under their supervision.
                    - Prescription Generation: Add professional notes and withdrawal periods; system generates official prescriptions.
                    - Farmer Directory: View and manage their registered farmers and their animals.
                    - Professional Reports: Generate reports on farmer compliance and treatment patterns.
                    - Approval Workflow: Their approval is crucial for system compliance and farmer operations.
                    - Quality Assurance: Ensure proper antimicrobial use and animal welfare standards.
                `;
                break;
            case "regulator":
                roleContext = `
                    The user is a REGULATOR.
                    - Dashboard Overview: View high-level, aggregated statistics on regional livestock health and AMU patterns.
                    - Compliance Monitoring: Track regional compliance rates and identify areas needing attention.
                    - Trend Analysis: Analyze antimicrobial usage trends and resistance patterns over time.
                    - Demographic Insights: View livestock demographics and distribution across regions.
                    - Geospatial Maps: Interactive heatmaps showing AMU patterns and compliance by location.
                    - Policy Support: Access data for evidence-based policy making and regulatory decisions.
                    - Privacy Protection: All data is anonymized and aggregated to protect individual farm privacy.
                `;
                break;
            default:
                roleContext = `
                    The user is logged in with an unrecognized role.
                    - Provide general guidance and suggest contacting support for role clarification.
                `;
        }
    }

    return `
        ${baseRules}

        Use this internal knowledge base when answering:
        ${LIVESTOCKIQ_KB}

        Current user context:
        ${roleContext}

        When relevant, remind users about veterinary approval requirements, withdrawal periods for food safety, and the importance of accurate record keeping. Keep answers helpful and actionable, pointing users to the next best steps in the application.
    `;
};

// Helper function to format AI response text for safe HTML rendering
const formatResponse = (text) => {
    const boldedText = text.replace(/<b>(.*?)<\/b>/g, "<strong>$1</strong>");
    return { __html: boldedText };
};

export const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeText = `Hi, I'm IQ Buddy, your LivestockIQ assistant. I can help you with questions about managing livestock health records.`;
            
            setMessages([
                { role: 'model', text: welcomeText }
            ]);
        }
    }, [isOpen, user, messages.length]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        const systemPrompt = generateSystemPrompt(user);
        const fullPrompt = `${systemPrompt}\n\nUser Question: "${currentInput}"`;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: fullPrompt }] }];
            const payload = { contents: chatHistory };

            // Replace with your actual Gemini API key
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();

            let aiResponseText = "Sorry, I couldn't get a response. Please try again.";
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                aiResponseText = result.candidates[0].content.parts[0].text;
            }

            const aiMessage = { role: 'model', text: aiResponseText };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage = {
                role: 'model',
                text: 'Sorry, I am having trouble connecting. Please try again later.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="rounded-full w-16 h-16 shadow-lg bg-green-700 hover:bg-green-800 transition-transform duration-200 hover:scale-110"
                    aria-label="Open IQ Buddy chat"
                >
                    {isOpen ? <X className="!w-7 !h-7" /> : <Bot className="!w-7 !h-7" />}
                </Button>
            </div>

            {/* Chat Window */}
            {isOpen && (
                <Card className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] flex flex-col shadow-2xl transition-all duration-300 ease-in-out">
                    <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-green-50">
                        <CardTitle className="text-lg font-semibold text-green-800">IQ Buddy</CardTitle>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-green-100"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <div 
                            ref={chatContainerRef}
                            className="h-full overflow-y-auto p-4 space-y-3"
                            style={{ maxHeight: '380px' }}
                        >
                            {messages.map((msg, index) => (
                                <div 
                                    key={index} 
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div 
                                        className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-green-600 text-white rounded-br-sm' 
                                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                        }`}
                                    >
                                        <p 
                                            style={{ whiteSpace: "pre-wrap" }}
                                            dangerouslySetInnerHTML={formatResponse(msg.text)}
                                        />
                                    </div>
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-lg px-3 py-2 rounded-bl-sm">
                                        <div className="flex items-center space-x-1">
                                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </CardContent>
                    
                    <div className="p-2 md:p-4 border-t bg-white">
                        <div className="flex gap-2">
                            <Input 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                                placeholder="Ask about LivestockIQ..." 
                                disabled={isLoading}
                                className="flex-1 focus:ring-green-500 focus:border-green-500"
                            />
                            <Button 
                                onClick={handleSend} 
                                disabled={isLoading || !input.trim()}
                                className="bg-green-700 hover:bg-green-800 disabled:bg-gray-300"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </>
    );
};