import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '../../contexts/AuthContext';
import { createTicket } from '../../services/ticketService';
import { useToast } from '../../hooks/use-toast';

// UPDATED IMPORTS ✅
import { Send, CheckCircle2, AlertCircle, HelpCircle, Loader2, History } from 'lucide-react';

const RaiseTicketPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        priority: 'Medium',
        description: '',
    });
    const [errors, setErrors] = useState({});

    const categories = [
        'Technical Issue',
        'Account Problem',
        'Feature Request',
        'Bug Report',
        'General Inquiry',
        'Other',
    ];

    const priorities = ['Low', 'Medium', 'High', 'Urgent'];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
        if (!formData.category) newErrors.category = 'Please select a category';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        else if (formData.description.trim().length < 20)
            newErrors.description = 'Description must be at least 20 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields correctly.",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await createTicket(formData);
            setTicketId(response.ticket.ticketId);
            setSuccess(true);
            toast({
                title: "Ticket Created Successfully!",
                description: `Your ticket ID is ${response.ticket.ticketId}.`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error Creating Ticket",
                description: error.message || "Failed to create support ticket. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            subject: '',
            category: '',
            priority: 'Medium',
            description: '',
        });
        setErrors({});
        setSuccess(false);
        setTicketId('');
    };

    const getRoleBasedPath = () => {
        const role = user?.role?.toLowerCase();
        // Map 'veterinarian' to 'vet' for URL routing
        const urlRole = role === 'veterinarian' ? 'vet' : role;
        return `/${urlRole}/support/history`;
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto">
                <Card className="border-0 shadow-lg">
                    <CardContent className="pt-12 pb-8 text-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Created Successfully!</h2>
                        <p className="text-gray-600 mb-6">
                            Your support ticket has been submitted and our team will review it shortly.
                        </p>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
                            <p className="text-sm text-emerald-800 font-medium mb-1">Your Ticket ID</p>
                            <p className="text-2xl font-bold text-emerald-600">{ticketId}</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={handleReset} variant="outline">
                                Create Another Ticket
                            </Button>
                            <Button onClick={() => navigate(getRoleBasedPath())} className="bg-emerald-600 hover:bg-emerald-700">
                                View My Tickets
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* UPDATED HEADER WITH BUTTON ✅ */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                            <HelpCircle className="w-4 h-4" />
                            <span>Support Center</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Raise a Support Ticket</h1>
                        <p className="text-slate-400">
                            Need help? Submit a support ticket and our team will assist you as soon as possible.
                        </p>
                    </div>

                    {/* NEW "My Tickets" BUTTON (Top Right) ✅ */}
                    <Button
                        onClick={() => navigate(getRoleBasedPath().replace('/raise-ticket', '/history'))}
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 border-white/30 text-white"
                    >
                        <History className="w-4 h-4 mr-2" />
                        My Tickets
                    </Button>
                </div>
            </div>

            {/* FORM */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle>Ticket Details</CardTitle>
                    <CardDescription>
                        Please provide detailed information about your issue or request
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* SUBJECT */}
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
                            <Input
                                id="subject"
                                placeholder="Brief summary of your issue"
                                value={formData.subject}
                                onChange={(e) => handleChange('subject', e.target.value)}
                                maxLength={200}
                                className={errors.subject ? 'border-red-500' : ''}
                            />
                            {errors.subject && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.subject}
                                </p>
                            )}
                        </div>

                        {/* CATEGORY + PRIORITY */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Category <span className="text-red-500">*</span></Label>
                                <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="space-y-2">
                            <Label>Description <span className="text-red-500">*</span></Label>
                            <Textarea
                                placeholder="Describe your issue or request in detail"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={8}
                                className={errors.description ? 'border-red-500' : ''}
                            />
                        </div>

                        {/* SUBMIT BUTTONS */}
                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={handleReset} disabled={loading} className="flex-1">
                                Reset
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Ticket
                                    </>
                                )}
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default RaiseTicketPage;
