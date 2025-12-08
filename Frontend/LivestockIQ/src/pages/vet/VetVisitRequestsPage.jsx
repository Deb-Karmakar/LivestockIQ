// frontend/src/pages/vet/VetVisitRequestsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Stethoscope, Search, Filter, Calendar, Clock, User, Phone,
    MapPin, CheckCircle, XCircle, Loader2, AlertTriangle, Sparkles,
    RefreshCw
} from "lucide-react";
import { getVetVisitRequests, respondToVetVisitRequest } from '../../services/vetVisitService';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';

const getUrgencyBadge = (urgency) => {
    switch (urgency) {
        case 'Emergency':
            return <Badge className="bg-red-500 hover:bg-red-600 text-white">🚨 Emergency</Badge>;
        case 'Urgent':
            return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">⚠️ Urgent</Badge>;
        default:
            return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Normal</Badge>;
    }
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'Requested':
            return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Pending</Badge>;
        case 'Accepted':
            return <Badge className="bg-green-500 hover:bg-green-600 text-white">Accepted</Badge>;
        case 'Declined':
            return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Declined</Badge>;
        case 'Completed':
            return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Completed</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const VetVisitRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [respondingTo, setRespondingTo] = useState(null);
    const { toast } = useToast();

    const fetchRequests = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await getVetVisitRequests(params);
            setRequests(response.data || []);

            if (isRefresh) {
                toast({ title: "Refreshed", description: "Visit requests updated." });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load visit requests.'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const filteredRequests = requests.filter(req => {
        const matchesSearch = searchTerm === '' ||
            req.animalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.animalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.farmerId?.farmOwner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.farmerId?.farmName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const pendingCount = requests.filter(r => r.status === 'Requested').length;
    const acceptedCount = requests.filter(r => r.status === 'Accepted').length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-teal-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading visit requests...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-teal-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Farm Visits</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Visit Requests
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Manage farm visit requests from your supervised farmers. You have{' '}
                            <span className="text-teal-400 font-semibold">{pendingCount} pending</span> and{' '}
                            <span className="text-blue-400 font-semibold">{acceptedCount} scheduled</span> visits.
                        </p>
                    </div>

                    <Button
                        onClick={() => fetchRequests(true)}
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        disabled={refreshing}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-xl">
                                <Filter className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                                <CardTitle>Visit Requests</CardTitle>
                                <CardDescription>
                                    Showing {filteredRequests.length} of {requests.length} requests
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-36">
                                    <SelectValue placeholder="Status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Requested">Pending</SelectItem>
                                    <SelectItem value="Accepted">Accepted</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Declined">Declined</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search farmer or animal..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {filteredRequests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRequests.map((request) => (
                                <VisitRequestCard
                                    key={request._id}
                                    request={request}
                                    onRespond={() => setRespondingTo(request)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Stethoscope className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-xl font-semibold text-gray-700">No visit requests</p>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                {statusFilter !== 'all'
                                    ? "Try changing the filter to see more requests."
                                    : "Farmers will request visits here when they need you."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Response Dialog */}
            <RespondDialog
                request={respondingTo}
                isOpen={!!respondingTo}
                onClose={() => setRespondingTo(null)}
                onSuccess={() => {
                    setRespondingTo(null);
                    fetchRequests();
                }}
            />
        </div>
    );
};

// Visit Request Card Component
const VisitRequestCard = ({ request, onRespond }) => {
    const isPending = request.status === 'Requested';
    const isAccepted = request.status === 'Accepted';

    return (
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-xl">
                            <Stethoscope className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{request.animalName || request.animalId}</CardTitle>
                            <CardDescription>{request.animalId}</CardDescription>
                        </div>
                    </div>
                    {getStatusBadge(request.status)}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Farmer Info */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{request.farmerId?.farmOwner}</span>
                    </div>
                    <p className="text-sm text-gray-500">{request.farmerId?.farmName}</p>
                    {request.farmerId?.phoneNumber && (
                        <a href={`tel:${request.farmerId.phoneNumber}`} className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                            <Phone className="h-3 w-3" />
                            {request.farmerId.phoneNumber}
                        </a>
                    )}
                </div>

                {/* Reason & Notes */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-sm">{request.reason}</span>
                    </div>
                    {request.notes && (
                        <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                            "{request.notes}"
                        </p>
                    )}
                </div>

                {/* Urgency & Date */}
                <div className="flex items-center justify-between">
                    {getUrgencyBadge(request.urgency)}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(request.createdAt), 'MMM d, h:mm a')}
                    </div>
                </div>

                {/* Scheduled Date (if accepted) */}
                {isAccepted && request.scheduledDate && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">
                                Scheduled: {format(new Date(request.scheduledDate), 'PPP')}
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {isPending && (
                    <Button
                        onClick={onRespond}
                        className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Respond to Request
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

// Respond Dialog Component
const RespondDialog = ({ request, isOpen, onClose, onSuccess }) => {
    const [action, setAction] = useState('accept');
    const [scheduledDate, setScheduledDate] = useState('');
    const [vetNotes, setVetNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setAction('accept');
            setScheduledDate('');
            setVetNotes('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (action === 'accept' && !scheduledDate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a visit date.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await respondToVetVisitRequest(request._id, {
                action,
                scheduledDate: action === 'accept' ? scheduledDate : undefined,
                vetNotes
            });
            toast({
                title: action === 'accept' ? 'Visit Scheduled' : 'Request Declined',
                description: action === 'accept'
                    ? 'The farmer has been notified of your visit date.'
                    : 'The farmer has been notified.'
            });
            onSuccess();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to respond. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!request) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                            <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle>Respond to Visit Request</DialogTitle>
                            <DialogDescription>
                                From {request?.farmerId?.farmOwner} for {request?.animalName || request?.animalId}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Request Details */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Reason:</span>
                                <span className="font-medium">{request.reason}</span>
                            </div>
                            {request.notes && (
                                <div>
                                    <span className="text-sm text-gray-500">Notes:</span>
                                    <p className="text-sm mt-1 italic">"{request.notes}"</p>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Urgency:</span>
                                {getUrgencyBadge(request.urgency)}
                            </div>
                        </div>

                        {/* Action Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Your Response</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={action === 'accept' ? 'default' : 'outline'}
                                    className={action === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setAction('accept')}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Accept
                                </Button>
                                <Button
                                    type="button"
                                    variant={action === 'decline' ? 'default' : 'outline'}
                                    className={action === 'decline' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setAction('decline')}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Decline
                                </Button>
                            </div>
                        </div>

                        {/* Scheduled Date (if accepting) */}
                        {action === 'accept' && (
                            <div className="space-y-2">
                                <Label htmlFor="scheduledDate" className="text-sm font-medium">
                                    Visit Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="scheduledDate"
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="vetNotes" className="text-sm font-medium">
                                Notes for Farmer <span className="text-gray-400">(Optional)</span>
                            </Label>
                            <Textarea
                                id="vetNotes"
                                value={vetNotes}
                                onChange={(e) => setVetNotes(e.target.value)}
                                placeholder={action === 'accept'
                                    ? "Any preparation instructions for the farmer..."
                                    : "Reason for declining (optional)..."}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={action === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : action === 'accept' ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Schedule Visit
                                </>
                            ) : (
                                <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Decline Request
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default VetVisitRequestsPage;
