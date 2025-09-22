import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, MoreHorizontal, CalendarIcon, Search, FileDown, ShieldCheck, ShieldAlert, Shield, CheckCircle2, Upload } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getAnimals } from '../../services/animalService';
import { getTreatments, addTreatment } from '../../services/treatmentService';
import { useAuth } from '../../contexts/AuthContext';
import { getVetDetailsByCode } from '../../services/vetService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// --- Static Data ---
const mockDrugs = [
    { name: 'Enrofloxacin', withdrawalDays: 7 },
    { name: 'Amoxicillin', withdrawalDays: 14 },
    { name: 'Ivermectin', withdrawalDays: 28 },
    { name: 'Tylosin', withdrawalDays: 3 },
];

// --- Helper Functions ---
const getWithdrawalInfo = (treatment) => {
    const drug = mockDrugs.find(d => d.name === treatment.drugName);
    if (!drug) return { endDate: null, daysLeft: 'N/A', status: 'unknown' };
    const endDate = addDays(new Date(treatment.startDate), drug.withdrawalDays);
    const daysLeft = differenceInDays(endDate, new Date());
    let status;
    if (daysLeft <= 0) status = 'safe';
    else if (daysLeft <= 5) status = 'ending_soon';
    else status = 'active';
    return { endDate, daysLeft: daysLeft > 0 ? daysLeft : 0, status };
};

const StatusBadge = ({ status }) => {
    const config = {
        safe: { text: 'Safe for Sale', color: 'bg-green-100 text-green-800', icon: <ShieldCheck className="h-3 w-3" /> },
        ending_soon: { text: 'Ending Soon', color: 'bg-yellow-100 text-yellow-800', icon: <ShieldAlert className="h-3 w-3" /> },
        active: { text: 'Active Withdrawal', color: 'bg-red-100 text-red-800', icon: <Shield className="h-3 w-3" /> },
    }[status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: <Shield className="h-3 w-3" /> };
    return <Badge className={`flex items-center gap-1.5 ${config.color} hover:${config.color}`}>{config.icon}{config.text}</Badge>;
};

// UPDATED: Function to generate the treatment record PDF with logo
const generateTreatmentPDF = (treatment, farmer, vet, withdrawalInfo) => {
    const doc = new jsPDF();

    // 1. Add LivestockIQ logo (text-based)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 34); // Forest Green color in RGB
    doc.text("LivestockIQ", 14, 22);

    // Reset font and color for the rest of the document
    doc.setFont('helhelvetica', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0); // Black color

    // Move down the main title to accommodate the logo
    doc.text("New Treatment Record", 14, 35); // Adjusted Y position
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy, h:mm a')}`, 14, 43); // Adjusted Y position

    // Farm and Vet Details - adjusted startY
    autoTable(doc, {
        startY: 53, // Adjusted startY to be below the new header
        head: [['Farmer Details', 'Supervising Veterinarian']],
        body: [[
            `Farmer: ${farmer.name || 'N/A'}\nFarm: ${farmer.farmName || 'N/A'}`,
            `Vet: ${vet.fullName}\nVet ID: ${vet.vetId}`
        ]],
        theme: 'striped'
    });

    // Treatment Details - adjusted startY
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
            ['Withdrawal End Date:', format(withdrawalInfo.endDate, 'PPP')],
        ],
        theme: 'grid'
    });
    
    // Footer / Confirmation
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("This record has been submitted for verification.", 14, doc.lastAutoTable.finalY + 20);

    doc.save(`TreatmentRecord_${treatment.animalId}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

const TreatmentsPage = () => {
    const [treatments, setTreatments] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [supervisingVet, setSupervisingVet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const promises = [getTreatments(), getAnimals()];
            if (user?.vetId) {
                promises.push(getVetDetailsByCode(user.vetId));
            }
            const [treatmentsData, animalsData, vetData] = await Promise.all(promises);
            setTreatments(Array.isArray(treatmentsData) ? treatmentsData : []);
            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setSupervisingVet(vetData || null);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load page data." });
        } finally {
            setLoading(false);
        }
    }, [toast, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveTreatment = async (newTreatmentData) => {
        const dataToSave = { ...newTreatmentData, vetId: supervisingVet?.vetId };
        try {
            await addTreatment(dataToSave);
            toast({ title: "Success", description: "New treatment record has been saved." });
            
            const withdrawalInfo = getWithdrawalInfo(dataToSave);
            // Ensure user has farmer-specific data like farmName
            const farmerDataForPdf = { 
                name: user?.name, // assuming 'name' for farmer's owner name
                farmName: user?.farmName // assuming 'farmName' is available on the user object
            };

            if (user && supervisingVet && withdrawalInfo.endDate) {
                generateTreatmentPDF(dataToSave, farmerDataForPdf, supervisingVet, withdrawalInfo);
            }

            fetchData();
            setIsFormOpen(false);
        } catch(error) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to save treatment." });
        }
    };

    const filteredTreatments = useMemo(() => {
        if (!Array.isArray(treatments)) return [];
        return treatments.filter(t =>
            (t.animalId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (t.drugName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [treatments, searchTerm]);
    
    if (loading) return <div className="p-8 text-center">Loading treatment records...</div>

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
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Treatment History</CardTitle>
                            <CardDescription>All recorded treatments from your database are listed below.</CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input placeholder="Search by Animal ID or Drug Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                                <TableHead>Status</TableHead>
                                <TableHead>Vet Signed</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTreatments.length > 0 ? filteredTreatments.map(treatment => {
                                const { endDate, daysLeft, status } = getWithdrawalInfo(treatment);
                                return (
                                    <TableRow key={treatment._id}>
                                        <TableCell className="font-medium">{treatment.animalId}</TableCell>
                                        <TableCell>{treatment.drugName}</TableCell>
                                        <TableCell>{endDate ? format(endDate, 'MMM d, yyyy') : 'N/A'}</TableCell>
                                        <TableCell className="font-semibold">{daysLeft}</TableCell>
                                        <TableCell><StatusBadge status={status} /></TableCell>
                                        <TableCell>{treatment.vetSigned ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            {/* Actions Dropdown can be added here */}
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No treatments found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

const TreatmentFormDialog = ({ onSave, onClose, animals, supervisingVet }) => {
    const [startDate, setStartDate] = useState(new Date());
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            animalId: formData.get('animalId'),
            drugName: selectedDrug?.name,
            startDate: startDate,
            dose: formData.get('dose'),
            route: formData.get('route'),
            notes: formData.get('notes'),
        };
        onSave(data);
    };

    const withdrawalEndDate = selectedDrug ? format(addDays(startDate, selectedDrug.withdrawalDays), 'MMM d, yyyy') : 'Select a drug';

    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Add New Treatment Record</DialogTitle>
                <DialogDescription>Fill in the details below. Your supervising vet will be automatically assigned.</DialogDescription>
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
                            <Select name="drugName" onValueChange={(val) => setSelectedDrug(mockDrugs.find(d => d.name === val))} required>
                                <SelectTrigger><SelectValue placeholder="Select Drug from Inventory" /></SelectTrigger>
                                <SelectContent>{mockDrugs.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dose">Dose (Value)</Label>
                                <Input id="dose" name="dose" type="number" step="0.01" placeholder="e.g., 10" />
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
                    </div>
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(startDate, 'PPP')}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                            </Popover>
                        </div>
                        <Card className="bg-gray-50 text-center">
                            <CardHeader><CardTitle className="text-base">Calculated Withdrawal End Date</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-green-600">{withdrawalEndDate}</p></CardContent>
                        </Card>
                         <div className="space-y-2">
                            <Label>Supervising Veterinarian</Label>
                            {supervisingVet ? (
                                <div className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{supervisingVet.fullName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{supervisingVet.fullName}</p>
                                        <p className="text-xs text-muted-foreground">ID: {supervisingVet.vetId}</p>
                                    </div>
                                </div>
                            ) : (
                                <Input value="No supervising vet assigned to your profile." disabled />
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Treatment</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default TreatmentsPage;