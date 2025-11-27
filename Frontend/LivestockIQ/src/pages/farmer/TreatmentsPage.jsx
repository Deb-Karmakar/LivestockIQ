// frontend/src/pages/farmer/TreatmentsPage.jsx

// --- IMPORTS ---
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, CalendarIcon, Search, FileDown, ShieldCheck, ShieldAlert, Shield, CheckCircle2, XCircle, Clock, MessageSquareQuote, Filter, Pill, Syringe, Sparkles } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getAnimals } from '../../services/animalService';
import { getTreatments, addTreatment } from '../../services/treatmentService';
import { getVetDetailsByCode } from '../../services/vetService';
import { getMyProfile } from '../../services/farmerService';
import { useAuth } from '../../contexts/AuthContext';
import { useTreatmentFilter } from '../../hooks/useTreatmentFilter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// --- HELPER FUNCTIONS ---
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
        safe: { text: 'Safe for Sale', color: 'bg-green-100 text-green-800 border-green-300', icon: <ShieldCheck className="h-3 w-3" /> },
        ending_soon: { text: 'Ending Soon', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <ShieldAlert className="h-3 w-3" /> },
        active: { text: 'Active Withdrawal', color: 'bg-red-100 text-red-800 border-red-300', icon: <Shield className="h-3 w-3" /> },
        pending: { text: 'Pending Vet Input', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: <Clock className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || config['pending'];
    return <Badge className={`flex items-center gap-1.5 border ${finalConfig.color} hover:${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
};

const ApprovalStatusBadge = ({ status }) => {
    const config = {
        'Pending': { text: 'Pending Vet Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-3 w-3" /> },
        'Approved': { text: 'Approved by Vet', color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle2 className="h-3 w-3" /> },
        'Rejected': { text: 'Rejected by Vet', color: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || config['Pending'];
    return <Badge className={`flex items-center gap-1.5 w-fit border ${finalConfig.color} hover:${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
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

const exportAllTreatmentsPDF = (treatments, farmer, vet) => {
    const doc = new jsPDF();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 34);
    doc.text("LivestockIQ", 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Treatment History Report", 14, 35);

    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy, h:mm a')}`, 14, 43);

    // Farm and Vet Info
    if (farmer || vet) {
        const farmInfo = farmer ? `${farmer.farmOwner} - ${farmer.farmName}` : 'N/A';
        const vetInfo = vet ? `${vet.fullName} (${vet.vetId})` : 'No vet assigned';

        autoTable(doc, {
            startY: 53,
            head: [['Farm Information', 'Supervising Veterinarian']],
            body: [[farmInfo, vetInfo]],
            theme: 'striped',
            headStyles: { fillColor: [34, 139, 34] }
        });
    }

    // Summary Statistics
    const stats = {
        total: treatments.length,
        pending: treatments.filter(t => t.status === 'Pending').length,
        approved: treatments.filter(t => t.status === 'Approved').length,
        rejected: treatments.filter(t => t.status === 'Rejected').length,
        safeForSale: treatments.filter(t => {
            const info = getWithdrawalInfo(t);
            return info.status === 'safe';
        }).length,
        activeWithdrawals: treatments.filter(t => {
            const info = getWithdrawalInfo(t);
            return info.status === 'active';
        }).length
    };

    autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 70,
        head: [['Summary Statistics']],
        body: [
            [`Total Treatments: ${stats.total}`],
            [`Pending Approval: ${stats.pending}`],
            [`Approved: ${stats.approved}`],
            [`Rejected: ${stats.rejected}`],
            [`Animals Safe for Sale: ${stats.safeForSale}`],
            [`Active Withdrawals: ${stats.activeWithdrawals}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [34, 139, 34] }
    });

    // Treatment Details Table
    if (treatments.length > 0) {
        const treatmentTableData = treatments.map((treatment) => {
            const withdrawalInfo = getWithdrawalInfo(treatment);
            const withdrawalStatus = withdrawalInfo.status === 'safe' ? 'Safe' :
                withdrawalInfo.status === 'active' ? `${withdrawalInfo.daysLeft} days left` :
                    withdrawalInfo.status === 'ending_soon' ? `${withdrawalInfo.daysLeft} days (ending soon)` :
                        'Pending Vet';

            return [
                treatment.animalId,
                treatment.drugName,
                treatment.dose || 'N/A',
                treatment.route || 'N/A',
                treatment.startDate ? format(new Date(treatment.startDate), 'MM/dd/yyyy') : 'N/A',
                withdrawalInfo.endDate ? format(withdrawalInfo.endDate, 'MM/dd/yyyy') : 'Pending',
                withdrawalStatus,
                treatment.status
            ];
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Animal ID', 'Drug', 'Dose', 'Route', 'Start Date', 'End Date', 'Withdrawal Status', 'Approval']],
            body: treatmentTableData,
            theme: 'striped',
            headStyles: { fillColor: [34, 139, 34] },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 30 },
                2: { cellWidth: 20 },
                3: { cellWidth: 20 },
                4: { cellWidth: 22 },
                5: { cellWidth: 22 },
                6: { cellWidth: 28 },
                7: { cellWidth: 20 }
            }
        });
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // Save the PDF
    doc.save(`Treatment_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// --- Treatment Card Component ---
const TreatmentCard = ({ treatment }) => {
    const { endDate, daysLeft, status: withdrawalStatus } = getWithdrawalInfo(treatment);

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <Pill className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg leading-tight break-words">
                                {treatment.drugName}
                            </CardTitle>
                            <CardDescription className="mt-1">Animal ID: {treatment.animalId}</CardDescription>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <WithdrawalStatusBadge status={withdrawalStatus} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Withdrawal Countdown */}
                {withdrawalStatus !== 'pending' && (
                    <div className={`rounded-lg p-4 text-center ${withdrawalStatus === 'safe' ? 'bg-green-50 border border-green-200' :
                        withdrawalStatus === 'ending_soon' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-red-50 border border-red-200'
                        }`}>
                        <div className="text-3xl font-bold mb-1">
                            {daysLeft === 0 ? '✓' : daysLeft}
                        </div>
                        <div className="text-sm font-medium">
                            {daysLeft === 0 ? 'Withdrawal Complete' : `Day${daysLeft > 1 ? 's' : ''} Until Safe`}
                        </div>
                    </div>
                )}

                {/* Treatment Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-slate-500 text-xs mb-1">Dose</div>
                        <div className="font-medium">{treatment.dose || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs mb-1">Route</div>
                        <div className="font-medium">{treatment.route || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Start Date
                        </div>
                        <div className="font-medium">
                            {treatment.startDate ? format(new Date(treatment.startDate), 'MMM d, yyyy') : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Withdrawal End
                        </div>
                        <div className="font-medium">
                            {endDate ? format(endDate, 'MMM d, yyyy') : 'Pending Vet'}
                        </div>
                    </div>
                </div>

                {/* Approval Status */}
                <div className="pt-2 border-t">
                    <ApprovalStatusBadge status={treatment.status} />
                </div>

                {/* Vet Notes */}
                {treatment.vetNotes && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-start gap-2">
                            <MessageSquareQuote className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-blue-800 text-sm">Veterinarian's Notes:</p>
                                <p className="text-sm text-gray-700 mt-1">{treatment.vetNotes}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
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

    const {
        filteredTreatments,
        searchTerm,
        setSearchTerm,
        filterBy,
        setFilterBy
    } = useTreatmentFilter(treatments);

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

    // Handler for the export button
    const handleExportPDF = () => {
        if (treatments.length === 0) {
            toast({
                variant: "destructive",
                title: "No data to export",
                description: "You need at least one treatment record to export."
            });
            return;
        }

        exportAllTreatmentsPDF(treatments, currentFarmer, supervisingVet);
        toast({
            title: "PDF Exported",
            description: `Successfully exported ${treatments.length} treatment record(s).`
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading treatment records...</p>
            </div>
        );
    }

    // Calculate stats
    const stats = {
        total: treatments.length,
        active: treatments.filter(t => getWithdrawalInfo(t).status === 'active').length,
        safe: treatments.filter(t => getWithdrawalInfo(t).status === 'safe').length,
        pending: treatments.filter(t => t.status === 'Pending').length
    };

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
                            <span>Treatment Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Treatment Records
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Log, track, and manage all antimicrobial treatments. You have{' '}
                            <span className="text-blue-400 font-semibold">{stats.total} treatments</span> with{' '}
                            <span className="text-amber-400 font-semibold">{stats.active} active withdrawals</span>.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto border-slate-600 text-white hover:bg-slate-700 bg-slate-800/50"
                            onClick={handleExportPDF}
                        >
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Add Treatment
                                </Button>
                            </DialogTrigger>
                            <TreatmentFormDialog onSave={handleSaveTreatment} onClose={() => setIsFormOpen(false)} animals={animals} supervisingVet={supervisingVet} />
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <Syringe className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle>Treatment History</CardTitle>
                                <CardDescription>All recorded treatments with their withdrawal and approval status.</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                            <div className="w-full sm:w-48">
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
                            <div className="relative w-full sm:w-64">
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
                <CardContent className="p-6">
                    {filteredTreatments.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredTreatments.map(treatment => (
                                <TreatmentCard key={treatment._id} treatment={treatment} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Syringe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-600">No treatments match your filters.</p>
                            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// The TreatmentFormDialog component
const TreatmentFormDialog = ({ onSave, onClose, animals, supervisingVet }) => {
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
                        </div>
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
                    </div>
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
                    <Button type="submit">Save & Submit for Review</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default TreatmentsPage;