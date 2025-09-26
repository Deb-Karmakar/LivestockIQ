import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { sendMessageToGroq } from '../services/chatService';

export const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeText = `Hi, I'm IQ Buddy, your LivestockIQ assistant. How can I help you today?`;
            setMessages([ { role: 'model', text: welcomeText } ]);
        }
    }, [isOpen, messages.length]);

    const handleSend = async () => {
        // This is a key diagnostic step.
        console.log("Send button clicked!"); 
        
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        const historyForAPI = messages.map(msg => ({ role: msg.role, text: msg.text }));

        try {
            const { reply } = await sendMessageToGroq(currentInput, historyForAPI);
            const aiMessage = { role: 'model', text: reply };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { role: 'model', text: 'Sorry, I am having trouble connecting. Please try again later.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="rounded-full w-16 h-16 shadow-lg bg-green-700 hover:bg-green-800 transition-transform duration-200 hover:scale-110"
                    aria-label="Open IQ Buddy chat"
                >
                    {isOpen ? <X className="!w-7 !h-7" /> : <Bot className="!w-7 !h-7" />}
                </Button>
            </div>

            {isOpen && (
                <Card className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-[500px] flex flex-col shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-green-50">
                        <CardTitle className="text-lg font-semibold text-green-800">IQ Buddy</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-green-100">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-4 overflow-y-auto space-y-3">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`rounded-lg px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap ${ msg.role === 'user' ? 'bg-green-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm' }`}>
                                    <p>{msg.text}</p>
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
                    </CardContent>
                    
                    <div className="p-2 md:p-4 border-t bg-white">
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter') handleSend(); }} // Corrected onKeyPress
                                placeholder="Ask about LivestockIQ..."
                                disabled={isLoading}
                                className="flex-1 focus-visible:ring-green-500"
                            />
                            <Button
                                onClick={handleSend} // Corrected onClick
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
