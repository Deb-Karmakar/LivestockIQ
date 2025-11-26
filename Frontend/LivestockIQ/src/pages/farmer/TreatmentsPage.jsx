// frontend/src/pages/farmer/TreatmentsPage.jsx

// --- IMPORTS ---
import React, { useState, useEffect, useCallback } from 'react'; // REMOVED useMemo
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, CalendarIcon, Search, FileDown, ShieldCheck, ShieldAlert, Shield, CheckCircle2, XCircle, Clock, MessageSquareQuote, Filter } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getAnimals } from '../../services/animalService';
import { getTreatments, addTreatment } from '../../services/treatmentService';
import { getVetDetailsByCode } from '../../services/vetService';
import { getMyProfile } from '../../services/farmerService';
import { useAuth } from '../../contexts/AuthContext';
import { useTreatmentFilter } from '../../hooks/useTreatmentFilter'; // 1. IMPORT the new hook
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// --- HELPER FUNCTIONS --- (These are unchanged)
const getWithdrawalInfo = (treatment) => {
    if (!treatment.withdrawalEndDate) return { endDate: null, daysLeft: 'N/A', status: 'pending' };
    const endDate = new Date(treatment.withdrawalEndDate);
    const daysLeft = differenceInDays(endDate, new Date());
    let status;
    if (daysLeft < 0) status = 'safe';
    else if (daysLeft <= 5) status = 'ending_soon';
    else status = 'active';
    return { endDate, daysLeft: daysLeft > 0 ? daysLeft : 0, status };
};
const WithdrawalStatusBadge = ({ status }) => {
    const config = {
        safe: { text: 'Safe for Sale', color: 'bg-green-100 text-green-800', icon: <ShieldCheck className="h-3 w-3" /> },
        ending_soon: { text: 'Ending Soon', color: 'bg-yellow-100 text-yellow-800', icon: <ShieldAlert className="h-3 w-3" /> },
        active: { text: 'Active Withdrawal', color: 'bg-red-100 text-red-800', icon: <Shield className="h-3 w-3" /> },
        pending: { text: 'Pending Vet Input', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || config['pending'];
    return <Badge className={`flex items-center gap-1.5 ${finalConfig.color} hover:${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
};
const ApprovalStatusBadge = ({ status }) => {
    const config = {
        'Pending': { text: 'Pending Vet Review', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
        'Approved': { text: 'Approved by Vet', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
        'Rejected': { text: 'Rejected by Vet', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || config['Pending'];
    return <Badge className={`flex items-center gap-1.5 w-fit ${finalConfig.color} hover:${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
};
const generateTreatmentPDF = (treatment, farmer, vet) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 34);
    doc.text("LivestockIQ", 14, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("New Treatment Record", 14, 35);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy, h:mm a')}`, 14, 43);
    autoTable(doc, {
        startY: 53,
        head: [['Farmer Details', 'Supervising Veterinarian']],
        body: [[`Farmer: ${farmer.farmOwner}\nFarm: ${farmer.farmName}`, `Vet: ${vet.fullName}\nVet ID: ${vet.vetId}`]],
        theme: 'striped'
    });
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Treatment Details', '']],
        body: [
            ['Animal ID:', treatment.animalId],
            ['Drug Name:', treatment.drugName],
            ['Dose:', treatment.dose],
            ['Route:', treatment.route],
            ['Reason / Notes:', treatment.notes || 'N/A'],
            ['Start Date:', format(new Date(treatment.startDate), 'PPP')],
            ['Withdrawal End Date:', 'To be determined by veterinarian.'],
        ],
        theme: 'grid'
    });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("This record has been submitted for verification.", 14, doc.lastAutoTable.finalY + 20);
    doc.save(`TreatmentRecord_${treatment.animalId}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

const TreatmentsPage = () => {
    const [treatments, setTreatments] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [supervisingVet, setSupervisingVet] = useState(null);
    const [currentFarmer, setCurrentFarmer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    // 2. CALL the hook to get the filtered list and control functions
    const {
        filteredTreatments,
        searchTerm,
        setSearchTerm,
        filterBy,
        setFilterBy
    } = useTreatmentFilter(treatments);

    // Your working fetchData and handleSaveTreatment functions are untouched.
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [treatmentsData, animalsData, farmerData] = await Promise.all([
                getTreatments(),
                getAnimals(),
                getMyProfile()
            ]);
            setTreatments(Array.isArray(treatmentsData) ? treatmentsData : []);
            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setCurrentFarmer(farmerData || null);

            if (farmerData?.vetId) {
                const vetData = await getVetDetailsByCode(farmerData.vetId);
                setSupervisingVet(vetData || null);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load page data." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveTreatment = async (newTreatmentData) => {
        const dataToSave = { ...newTreatmentData, vetId: supervisingVet?.vetId };
        try {
            await addTreatment(dataToSave);
            toast({ title: "Success", description: "New treatment record has been submitted for vet review." });

            if (currentFarmer && supervisingVet) {
                generateTreatmentPDF(dataToSave, currentFarmer, supervisingVet);
            }

            fetchData();
            setIsFormOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to save treatment." });
        }
    };

    // REMOVED: The old useMemo for filtering by search term is no longer needed.

    if (loading) return <div className="p-8 text-center">Loading treatment records...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Treatment Records</h1>
                    <p className="mt-1 text-gray-600">Log, track, and manage all antimicrobial treatments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Treatment</Button>
                        </DialogTrigger>
                        <TreatmentFormDialog onSave={handleSaveTreatment} onClose={() => setIsFormOpen(false)} animals={animals} supervisingVet={supervisingVet} />
                    </Dialog>
                    < /div>
                    < /div>
                    <Card>
                        <CardHeader>
                            {/* 3. ADD the new filter/search controls */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-grow">
                                    <CardTitle>Treatment History</CardTitle>
                                    <CardDescription>All recorded treatments are listed below, including their approval status.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <div className="w-full md:w-48">
                                        <Select value={filterBy} onValueChange={setFilterBy}>
                                            <SelectTrigger>
                                                <Filter className="h-4 w-4 mr-2" />
                                                <SelectValue placeholder="Filter by status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Show All</SelectItem>
                                                <SelectItem value="active">Active Withdrawals</SelectItem>
                                                <SelectItem value="ending_soon">Ending Soon</SelectItem>
                                                <SelectItem value="safe">Safe for Sale</SelectItem>
                                                <SelectItem value="pending">Pending Vet Input</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Animal ID</TableHead>
                                        <TableHead>Drug</TableHead>
                                        <TableHead>Withdrawal End</TableHead>
                                        <TableHead>Days Left</TableHead>
                                        <TableHead>Withdrawal Status</TableHead>
                                        <TableHead>Approval Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* The table now correctly maps over 'filteredTreatments' from the hook */}
                                    {filteredTreatments.length > 0 ? filteredTreatments.map(treatment => {
                                        const { endDate, daysLeft, status: withdrawalStatus } = getWithdrawalInfo(treatment);
                                        return (
                                            <React.Fragment key={treatment._id}>
                                                <TableRow>
                                                    <TableCell className="font-medium">{treatment.animalId}</TableCell>
                                                    <TableCell>{treatment.drugName}</TableCell>
                                                    <TableCell>{endDate ? format(endDate, 'MMM d, yyyy') : 'Pending Vet'}</TableCell>
                                                    <TableCell className="font-semibold text-center">{daysLeft}</TableCell>
                                                    <TableCell><WithdrawalStatusBadge status={withdrawalStatus} /></TableCell>
                                                    <TableCell><ApprovalStatusBadge status={treatment.status} /></TableCell>
                                                </TableRow>
                                                {treatment.vetNotes && (
                                                    <TableRow className="bg-slate-50 hover:bg-slate-100">
                                                        <TableCell colSpan={6} className="py-2 px-6">
                                                            <div className="flex items-start gap-3">
                                                                <MessageSquareQuote className="h-5 w-5 mt-1 text-blue-600 flex-shrink-0" />
                                                                <div>
                                                                    <p className="font-semibold text-blue-800">Veterinarian's Notes:</p>
                                                                    <p className="text-sm text-gray-700">{treatment.vetNotes}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">No treatments match your filters.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    < /div>
                    );
    };

                    // The TreatmentFormDialog component is completely unchanged.
                    const TreatmentFormDialog = ({onSave, onClose, animals, supervisingVet}) => {
    const [startDate, setStartDate] = useState(new Date());
    const handleSave = (e) => {
                        e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                        animalId: formData.get('animalId'),
                    drugName: formData.get('drugName'),
                    startDate: startDate,
                    dose: formData.get('dose'),
                    route: formData.get('route'),
                    notes: formData.get('notes'),
        };
                    onSave(data);
    };
                    return (
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Treatment Record</DialogTitle>
                            <DialogDescription>Fill in the details below. This record will be sent to your supervising vet for review and approval.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSave}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="animalId">Animal / Herd ID</Label>
                                        <Select name="animalId" required>
                                            <SelectTrigger><SelectValue placeholder="Select Animal/Herd" /></SelectTrigger>
                                            <SelectContent>{(animals || []).map(a => <SelectItem key={a._id} value={a.tagId}>{a.tagId} ({a.name || a.species})</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="drugName">Drug Name</Label>
                                        <Input id="drugName" name="drugName" placeholder="e.g., Amoxicillin" required />
                                    </div >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="dose">Dose (e.g., 10ml)</Label>
                                            <Input id="dose" name="dose" placeholder="e.g., 10ml" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="route">Route</Label>
                                            <Select name="route"><SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger><SelectContent><SelectItem value="Oral">Oral</SelectItem><SelectItem value="Injection">Injection</SelectItem><SelectItem value="Subcutaneous">Subcutaneous</SelectItem></SelectContent></Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Reason / Notes (Optional)</Label>
                                        <Textarea id="notes" name="notes" placeholder="e.g., Respiratory infection" />
                                    </div>
                                </div >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(startDate, 'PPP')}</Button></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Supervising Veterinarian</Label>
                                        {supervisingVet ? (
                                            <div className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback>{supervisingVet.fullName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    < p className="font-semibold" > {supervisingVet.fullName}</p >
                                                    <p className="text-xs text-muted-foreground">ID: {supervisingVet.vetId}</p>
                                                </div >
                                            </div >
                                        ) : (
                                            <Input value="No supervising vet assigned to your profile." disabled />
                                        )}
                                    </div >
                                </div >
                            </div >
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                <Button type="submit">Save & Submit for Review</Button>
                            </DialogFooter>
                        </form >
                    </DialogContent >
                    );
};

                    export default TreatmentsPage;