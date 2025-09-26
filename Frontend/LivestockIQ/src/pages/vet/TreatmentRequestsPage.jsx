import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle2, XCircle, Clock, FileText, Star, Loader2, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getTreatmentRequests } from '../../services/vetService';
import { updateTreatmentByVet } from '../../services/treatmentService';
import EditRequestDialog from './EditRequestDialog';
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/contexts/AuthContext';
import { useRequestSorter } from '../../hooks/useRequestSorter'; // 1. Import the custom hook

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
        'Pending': { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
        'Approved': { text: 'Approved', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
        'Rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> };
    return <Badge className={`flex items-center gap-1.5 w-fit ${finalConfig.color} hover:${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
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

// --- Main Treatment Requests Page Component ---
const TreatmentRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRequest, setEditingRequest] = useState(null);
    const [viewingHistoryOf, setViewingHistoryOf] = useState(null);
    const { toast } = useToast();
    const { user: vetUser } = useAuth();

    // 2. Call the hook to get sorting logic and the sorted data
    const { sortedRequests, requestSort, sortConfig } = useRequestSorter(requests);

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
        setLoading(true);
        fetchRequests().finally(() => setLoading(false));
    }, [fetchRequests]);

    const handleUpdateRequest = async (requestId, updateData) => {
        try {
            await updateTreatmentByVet(requestId, updateData);
            toast({ title: "Success", description: `Treatment record has been updated.` });
            
            const updatedRequests = await fetchRequests();

            if (updateData.status === 'Approved') {
                const fullRecordForPdf = updatedRequests.find(r => r._id === requestId);
                if (fullRecordForPdf) {
                    generateVetPdfCopy(fullRecordForPdf, vetUser);
                }
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
        setEditingRequest(null);
    };
    
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Treatment Requests</h1>
                <p className="mt-1 text-gray-600">Review and verify treatment records submitted by farmers.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Verifications</CardTitle>
                    <CardDescription>
                        You have {requests.filter(r => (r.status || 'Pending') === 'Pending').length} treatments to review.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => requestSort('farmer')}>
                                        Farmer <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>Animal Details</TableHead>
                                <TableHead>Drug Used</TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => requestSort('status')}>
                                        Status <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* 3. Map over the 'sortedRequests' array from the hook */}
                            {sortedRequests.map(req => (
                                <TableRow key={req._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarFallback>{req.farmerId?.farmOwner?.charAt(0) || 'F'}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-semibold">{req.farmerId?.farmOwner || 'Unknown Farmer'}</p>
                                                <p className="text-xs text-gray-500">{req.farmerId?.farmName || 'Unknown Farm'}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">ID: {req.animalId}</div>
                                        {req.animal ? (
                                            <div className="text-sm text-muted-foreground">
                                                {req.animal.species} • {req.animal.gender || ''} • {calculateAge(req.animal.dob)}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-destructive">Animal data not found</div>
                                        )}
                                    </TableCell>
                                    <TableCell>{req.drugName}</TableCell>
                                    <TableCell><StatusBadge status={req.status || 'Pending'} /></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingRequest(req)} disabled={req.status !== 'Pending'}>
                                                    <Star className="mr-2 h-4 w-4" />
                                                    <span>Review & Approve</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setViewingHistoryOf(req.animalId)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    <span>View History</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleUpdateRequest(req._id, { status: 'Rejected' })} className="text-red-600" disabled={req.status !== 'Pending'}>
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    <span>Reject</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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