import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Package, MapPin, Sparkles, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getFeedAdministrationRequests, approveFeedAdministration, rejectFeedAdministration } from '../../services/vetService';
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';

const StatusBadge = ({ status }) => {
    const config = {
        'Pending Approval': { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-3 w-3" /> },
        'Active': { text: 'Approved', color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle2 className="h-3 w-3" /> },
        'Rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || config['Pending Approval'];
    return <Badge className={`flex items-center gap-1.5 border ${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
};

const FeedRequestCard = ({ request, onApprove, onReject, onViewAnimalHistory }) => {
    const isPending = request.status === 'Pending Approval';
    const animalCount = request.animalIds?.length || 0;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-12 w-12 bg-purple-100">
                            <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
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
                    <StatusBadge status={request.status} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Feed & Group Details */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Package className="h-4 w-4" />
                        Feed Administration
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-slate-500">Feed:</span>
                            <span className="ml-2 font-medium">{request.feedId?.feedName || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Antimicrobial:</span>
                            <span className="ml-2 font-medium">{request.feedId?.antimicrobialName || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Group/Animals:</span>
                            <span className="ml-2 font-medium">{request.groupName || `${animalCount} animal(s)`}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Quantity:</span>
                            <span className="ml-2 font-medium">{request.feedQuantityUsed} {request.feedId?.unit || 'kg'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Start Date:</span>
                            <span className="ml-2 font-medium">{request.startDate ? format(new Date(request.startDate), 'MMM d, yyyy') : 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Withdrawal End:</span>
                            <span className="ml-2 font-medium">{request.withdrawalEndDate ? format(new Date(request.withdrawalEndDate), 'MMM d, yyyy') : 'TBD'}</span>
                        </div>
                    </div>
                </div>

                {request.notes && (
                    <div className="text-sm">
                        <span className="text-slate-500">Notes:</span>
                        <p className="mt-1 text-slate-700">{request.notes}</p>
                    </div>
                )}

                {/* Animal Details */}
                {request.animals && request.animals.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Animals in this Request</div>
                        <div className="flex flex-wrap gap-1">
                            {request.animals.map(animal => (
                                <button
                                    key={animal.tagId}
                                    onClick={() => onViewAnimalHistory(animal.tagId)}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                >
                                    {animal.tagId}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-2 pt-4 border-t">
                <Button
                    onClick={() => onApprove(request)}
                    disabled={!isPending}
                    className="flex-1"
                    size="sm"
                >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                </Button>
                <Button
                    onClick={() => onReject(request)}
                    disabled={!isPending}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                </Button>
            </CardFooter>
        </Card>
    );
};

const ApproveDialog = ({ request, onClose, onConfirm }) => {
    const [vetNotes, setVetNotes] = useState('');

    const handleSubmit = () => {
        onConfirm(request._id, vetNotes);
        onClose();
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Approve Feed Administration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-600">
                        You are approving feed administration for <strong>{request.groupName || `${request.animalIds?.length} animal(s)`}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        Feed: <strong>{request.feedId?.feedName}</strong> ({request.feedId?.antimicrobialName})
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vetNotes">Vet Notes (Optional)</Label>
                    <Textarea
                        id="vetNotes"
                        placeholder="Add any notes or instructions..."
                        value={vetNotes}
                        onChange={(e) => setVetNotes(e.target.value)}
                        rows={3}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit}>Approve Feed Administration</Button>
            </DialogFooter>
        </DialogContent>
    );
};

const RejectDialog = ({ request, onClose, onConfirm }) => {
    const [rejectionReason, setRejectionReason] = useState('');

    const handleSubmit = () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        onConfirm(request._id, rejectionReason);
        onClose();
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reject Feed Administration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-800">This will reject the feed administration</p>
                            <p className="text-xs text-red-700 mt-1">The feed quantity will be restored to inventory.</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                        id="rejectionReason"
                        placeholder="Please explain why this is being rejected..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="destructive" onClick={handleSubmit}>Reject Feed Administration</Button>
            </DialogFooter>
        </DialogContent>
    );
};

const FeedAdministrationRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvingRequest, setApprovingRequest] = useState(null);
    const [rejectingRequest, setRejectingRequest] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedAnimalId, setSelectedAnimalId] = useState(null);
    const { toast } = useToast();

    const fetchRequests = useCallback(async () => {
        try {
            const data = await getFeedAdministrationRequests();
            setRequests(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load feed requests." });
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

    const handleApprove = async (id, vetNotes) => {
        try {
            const response = await approveFeedAdministration(id, vetNotes);

            // Download PDF if provided
            if (response.vetPdfBuffer) {
                const byteCharacters = atob(response.vetPdfBuffer);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Vet_Approval_${Date.now()}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }

            toast({ title: "Success", description: "Approved! Prescription sent to farmer's email." });
            await fetchRequests();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to approve." });
        }
    };

    const handleReject = async (id, rejectionReason) => {
        try {
            await rejectFeedAdministration(id, rejectionReason);
            toast({ title: "Success", description: "Feed administration rejected." });
            await fetchRequests();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to reject." });
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return req.status === 'Pending Approval';
        if (activeTab === 'approved') return req.status === 'Active';
        if (activeTab === 'rejected') return req.status === 'Rejected';
        return true;
    });

    const pendingCount = requests.filter(r => r.status === 'Pending Approval').length;
    const approvedCount = requests.filter(r => r.status === 'Active').length;
    const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-purple-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading feed requests...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        <span>Feed Administration Verification</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold">
                        Feed Administration Requests
                    </h1>
                    <p className="text-slate-400 max-w-md">
                        Review and approve feed-based antimicrobial administrations. You have{' '}
                        <span className="text-yellow-400 font-semibold">{pendingCount} pending requests</span> and{' '}
                        <span className="text-green-400 font-semibold">{approvedCount} approved</span>.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">
                        All
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">{requests.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        Pending
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs bg-yellow-100 text-yellow-800">{pendingCount}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        Approved
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs bg-green-100 text-green-800">{approvedCount}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                        Rejected
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs bg-red-100 text-red-800">{rejectedCount}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {filteredRequests.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Package className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-lg font-medium text-gray-600">No requests found</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeTab === 'pending' && 'No pending feed requests at the moment.'}
                                    {activeTab === 'approved' && 'No approved feed administrations yet.'}
                                    {activeTab === 'rejected' && 'No rejected feed administrations.'}
                                    {activeTab === 'all' && 'No feed administration requests available.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRequests.map(req => (
                                <FeedRequestCard
                                    key={req._id}
                                    request={req}
                                    onApprove={(r) => setApprovingRequest(r)}
                                    onReject={(r) => setRejectingRequest(r)}
                                    onViewAnimalHistory={(animalId) => setSelectedAnimalId(animalId)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {approvingRequest && (
                <Dialog open={!!approvingRequest} onOpenChange={() => setApprovingRequest(null)}>
                    <ApproveDialog
                        request={approvingRequest}
                        onClose={() => setApprovingRequest(null)}
                        onConfirm={handleApprove}
                    />
                </Dialog>
            )}

            {rejectingRequest && (
                <Dialog open={!!rejectingRequest} onOpenChange={() => setRejectingRequest(null)}>
                    <RejectDialog
                        request={rejectingRequest}
                        onClose={() => setRejectingRequest(null)}
                        onConfirm={handleReject}
                    />
                </Dialog>
            )}

            {selectedAnimalId && (
                <AnimalHistoryDialog
                    animalId={selectedAnimalId}
                    isOpen={!!selectedAnimalId}
                    onClose={() => setSelectedAnimalId(null)}
                />
            )}
        </div>
    );
};

export default FeedAdministrationRequestsPage;
