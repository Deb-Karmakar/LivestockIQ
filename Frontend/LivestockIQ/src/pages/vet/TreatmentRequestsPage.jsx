import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle2, XCircle, Clock, FileText, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getTreatmentRequests } from '../../services/vetService';
import { updateTreatmentByVet } from '../../services/treatmentService';
import EditRequestDialog from './EditRequestDialog';
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
        'Pending': { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
        'Approved': { text: 'Approved', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
        'Rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> };
    return <Badge className={`flex items-center gap-1.5 w-fit ${finalConfig.color} hover:${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
};

// UPDATED: PDF generation function now includes the brand name
const generateVetPdfCopy = (treatment, vet) => {
    const doc = new jsPDF();
    
    // Add LivestockIQ logo (text-based) in green
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 34); // Forest Green color
    doc.text("LivestockIQ", 14, 22);

    // Reset font for the rest of the document
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40); // Black color

    doc.setFontSize(18);
    doc.text(`Prescription for Animal ${treatment.animalId}`, 14, 40);
    doc.setFontSize(12);
    doc.text(`Issued by: ${vet.name}`, 14, 48);
    
    autoTable(doc, {
        startY: 60,
        head: [['Field', 'Details']],
        body: [
            ['Farmer:', `${treatment.farmerId.farmOwner} (${treatment.farmerId.farmName})`],
            ['Animal Species:', treatment.animal.species],
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
    const { toast } = useToast();
    const { user: vetUser } = useAuth();

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTreatmentRequests();
            setRequests(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load requests." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleUpdateRequest = async (requestId, updateData) => {
        try {
            const updatedRecord = await updateTreatmentByVet(requestId, updateData);
            toast({ title: "Success", description: `Treatment record has been updated.` });

            if (updateData.status === 'Approved') {
                const originalRecord = requests.find(r => r._id === requestId);
                const fullRecordForPdf = { ...originalRecord, ...updatedRecord };
                generateVetPdfCopy(fullRecordForPdf, vetUser);
            }

            fetchRequests();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
        setEditingRequest(null);
    };
    
    if (loading) return <div>Loading requests...</div>

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
                                <TableHead>Farmer</TableHead>
                                <TableHead>Animal Details</TableHead>
                                <TableHead>Drug Used</TableHead>
                                <TableHead>Withdrawal End Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map(req => (
                                <TableRow key={req._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarFallback>{req.farmerId.farmOwner.charAt(0)}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-semibold">{req.farmerId.farmOwner}</p>
                                                <p className="text-xs text-gray-500">{req.farmerId.farmName}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">ID: {req.animalId}</div>
                                        {req.animal ? (
                                            <div className="text-sm text-muted-foreground">
                                                {req.animal.species} • {req.animal.gender || ''} • {calculateAge(req.animal.dob)} • {req.animal.weight}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-destructive">Animal data not found</div>
                                        )}
                                    </TableCell>
                                    <TableCell>{req.drugName}</TableCell>
                                    <TableCell>{req.withdrawalEndDate ? format(new Date(req.withdrawalEndDate), 'MMM d, yyyy') : 'Pending'}</TableCell>
                                    <TableCell><StatusBadge status={req.status || 'Pending'} /></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={req.status === 'Approved' || req.status === 'Rejected'}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingRequest(req)}>
                                                    <Star className="mr-2 h-4 w-4" />
                                                    <span>Review</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    <span>View History</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleUpdateRequest(req._id, { status: 'Rejected' })} className="text-red-600">
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
        </div>
    );
};

export default TreatmentRequestsPage;