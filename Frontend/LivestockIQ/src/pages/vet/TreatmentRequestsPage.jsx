import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, CheckCircle2, XCircle, Clock, FileText, Star, Stethoscope, MapPin, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getTreatmentRequests } from '../../services/vetService';
import { updateTreatmentByVet } from '../../services/treatmentService';
import EditRequestDialog from './EditRequestDialog';
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/contexts/AuthContext';

// --- Helper Functions ---
const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const dateOfBirth = new Date(dob);
    const ageDifMs = Date.now() - dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}, ${months} mo`;
    return `${months} month${months > 1 ? 's' : ''}`;
};

const StatusBadge = ({ status }) => {
    const config = {
        'Pending': { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-3 w-3" /> },
        'Approved': { text: 'Approved', color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle2 className="h-3 w-3" /> },
        'Rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: <Clock className="h-3 w-3" /> };
    return <Badge className={`flex items-center gap-1.5 w-fit border ${finalConfig.color} hover:${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
};

const generateVetPdfCopy = (treatment, vet) => {
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 34);
    doc.text("LivestockIQ", 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    doc.setFontSize(18);
    doc.text(`Prescription for Animal ${treatment.animalId}`, 14, 40);
    doc.setFontSize(12);
    doc.text(`Issued by: ${vet.fullName}`, 14, 48);

    autoTable(doc, {
        startY: 60,
        head: [['Field', 'Details']],
        body: [
            ['Farmer:', `${treatment.farmerId?.farmOwner || 'N/A'} (${treatment.farmerId?.farmName || 'N/A'})`],
            ['Animal Species:', treatment.animal?.species || 'N/A'],
            ['Drug:', treatment.drugName],
            ['Dose:', treatment.dose],
            ['Route:', treatment.route],
            ['Treatment Start Date:', treatment.startDate ? format(new Date(treatment.startDate), 'PPP') : 'N/A'],
            ['Withdrawal End Date:', treatment.withdrawalEndDate ? format(new Date(treatment.withdrawalEndDate), 'PPP') : 'N/A'],
            ['Vet Notes:', treatment.vetNotes || 'N/A']
        ]
    });

    doc.save(`Prescription_Copy_${treatment.animalId}.pdf`);
};

// --- Treatment Request Card Component ---
const TreatmentRequestCard = ({ request, onReview, onReject, onViewHistory }) => {
    const age = calculateAge(request.animal?.dob);
    const isPending = (request.status || 'Pending') === 'Pending';

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-12 w-12 bg-green-100">
                            <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                                {request.farmerId?.farmOwner?.charAt(0) || 'F'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{request.farmerId?.farmOwner || 'Unknown Farmer'}</CardTitle>
                            <CardDescription className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {request.farmerId?.farmName || 'Unknown Farm'}
                            </CardDescription>
                        </div>
                    </div>
                    <StatusBadge status={request.status || 'Pending'} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Animal Details */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Stethoscope className="h-4 w-4" />
                        Animal Information
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-slate-500">ID:</span>
                            <span className="ml-2 font-medium">{request.animalId}</span>
                        </div>
                        {request.animal ? (
                            <>
                                <div>
                                    <span className="text-slate-500">Species:</span>
                                    <span className="ml-2 font-medium">{request.animal.species}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Gender:</span>
                                    <span className="ml-2 font-medium">{request.animal.gender || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Age:</span>
                                    <span className="ml-2 font-medium">{age}</span>
                                </div>
                            </>
                        ) : (
                            <div className="col-span-2 text-red-600 text-xs">Animal data not found</div>
                        )}
                    </div>
                </div>

                {/* Drug Information */}
                <div className="space-y-1">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Drug Used</div>
                    <div className="text-lg font-semibold text-slate-900">{request.drugName}</div>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-4 border-t">
                <Button
                    onClick={() => onReview(request)}
                    disabled={!isPending}
                    className="flex-1"
                    size="sm"
                >
                    <Star className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Review</span>
                </Button>
                <Button
                    onClick={() => onReject(request)}
                    disabled={!isPending}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                >
                    <XCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Reject</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="px-2">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewHistory(request.animalId)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Animal History
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
};

// --- Main Treatment Requests Page Component ---
const TreatmentRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRequest, setEditingRequest] = useState(null);
    const [viewingHistoryOf, setViewingHistoryOf] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const { toast } = useToast();
    const { user: vetUser } = useAuth();

    const fetchRequests = useCallback(async () => {
        try {
            const data = await getTreatmentRequests();
            setRequests(data || []);
            return data || [];
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load requests." });
            return [];
        }
    }, [toast]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchRequests();
            setLoading(false);
        };
        load();
    }, [fetchRequests]);

    const handleUpdateRequest = async (requestId, updateData) => {
        try {
            await updateTreatmentByVet(requestId, updateData);
            toast({ title: "Success", description: `Treatment record has been updated.` });

            const updatedRequests = await fetchRequests();

            if (updateData.status === 'Approved') {
                const originalRequest = requests.find(r => r._id === requestId);
                if (originalRequest) {
                    const mergedRequest = { ...originalRequest, ...updateData };
                    generateVetPdfCopy(mergedRequest, vetUser);
                }
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
        setEditingRequest(null);
    };

    const handleReject = async (request) => {
        if (window.confirm(`Are you sure you want to reject the treatment request for animal ${request.animalId}?`)) {
            await handleUpdateRequest(request._id, { status: 'Rejected' });
        }
    };

    // Filter requests based on active tab
    const filteredRequests = requests.filter(req => {
        const status = req.status || 'Pending';
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return status === 'Pending';
        if (activeTab === 'approved') return status === 'Approved';
        if (activeTab === 'rejected') return status === 'Rejected';
        return true;
    });

    const pendingCount = requests.filter(r => (r.status || 'Pending') === 'Pending').length;
    const approvedCount = requests.filter(r => r.status === 'Approved').length;
    const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading treatment requests...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Treatment Verification</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Treatment Verifications
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Review and approve treatment requests from farmers. You have{' '}
                            <span className="text-yellow-400 font-semibold">{pendingCount} pending requests</span> and{' '}
                            <span className="text-green-400 font-semibold">{approvedCount} approved</span>.
                        </p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="all" className="relative">
                        All
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">{requests.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="relative">
                        Pending
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs bg-yellow-100 text-yellow-800">{pendingCount}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="relative">
                        Approved
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs bg-green-100 text-green-800">{approvedCount}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="relative">
                        Rejected
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs bg-red-100 text-red-800">{rejectedCount}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {filteredRequests.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-lg font-medium text-gray-600">No requests found</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeTab === 'pending' && 'No pending treatment requests at the moment.'}
                                    {activeTab === 'approved' && 'No approved treatments yet.'}
                                    {activeTab === 'rejected' && 'No rejected treatments.'}
                                    {activeTab === 'all' && 'No treatment requests available.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRequests.map(req => (
                                <TreatmentRequestCard
                                    key={req._id}
                                    request={req}
                                    onReview={() => setEditingRequest(req)}
                                    onReject={() => handleReject(req)}
                                    onViewHistory={setViewingHistoryOf}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {editingRequest && (
                <EditRequestDialog
                    request={editingRequest}
                    onClose={() => setEditingRequest(null)}
                    onSave={handleUpdateRequest}
                />
            )}

            <AnimalHistoryDialog
                animalId={viewingHistoryOf}
                isOpen={!!viewingHistoryOf}
                onClose={() => setViewingHistoryOf(null)}
            />
        </div>
    );
};

export default TreatmentRequestsPage;