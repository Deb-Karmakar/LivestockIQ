// frontend/src/pages/vet/FarmerDirectoryPage.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, MoreVertical, ShieldAlert, Sparkles, Users as UsersIcon, Syringe, Loader2 } from 'lucide-react';
import { axiosInstance } from '../../contexts/AuthContext';
import { getAnimalsForFarmer, reportFarmer, getMyFarmers, addTreatmentByVet } from '../../services/vetService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '../../hooks/use-toast';

const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const ageDifMs = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(ageDifMs);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();
    if (years > 0) return `${years} year${years > 1 ? "s" : ""}, ${months} mo`;
    return `${months} month${months > 1 ? "s" : ""}`;
};

const FarmerDirectoryPage = () => {
    const [farmers, setFarmers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [farmerAnimals, setFarmerAnimals] = useState([]);
    const [animalsLoading, setAnimalsLoading] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [treatmentAnimal, setTreatmentAnimal] = useState(null); // For Add Treatment dialog
    const { toast } = useToast();

    useEffect(() => {
        const fetchFarmers = async () => {
            try {
                setLoading(true);
                const data = await getMyFarmers();
                setFarmers(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load your farmers.' });
            } finally {
                setLoading(false);
            }
        };
        fetchFarmers();
    }, [toast]);

    const filteredFarmers = useMemo(() => farmers.filter(f =>
        f.farmOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.farmName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [farmers, searchTerm]);

    const handleViewAnimalsClick = async (farmer) => {
        setSelectedFarmer(farmer);
        setAnimalsLoading(true);
        try {
            const animalsData = await getAnimalsForFarmer(farmer._id);
            setFarmerAnimals(animalsData || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: "Could not fetch this farmer's animals." });
        } finally {
            setAnimalsLoading(false);
        }
    };

    const handleReportClick = (farmer) => {
        setSelectedFarmer(farmer);
        setIsReportDialogOpen(true);
    };

    const handleReportSubmit = async (reportData) => {
        try {
            await reportFarmer(reportData);
            toast({ title: 'Report Submitted', description: 'Your non-compliance report has been sent to the regulator.' });
            closeDialogs();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to submit report.' });
        }
    };

    const closeDialogs = () => {
        setSelectedFarmer(null);
        setFarmerAnimals([]);
        setIsReportDialogOpen(false);
        setTreatmentAnimal(null);
    };

    const handleAddTreatment = (farmer, animal) => {
        setSelectedFarmer(farmer);
        setTreatmentAnimal(animal);
    };

    const handleTreatmentSuccess = () => {
        setTreatmentAnimal(null);
        toast({ title: 'Treatment Recorded', description: 'Treatment has been saved and the farmer has been notified of the withdrawal period.' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading farmers...</p>
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
                            <span>Farmer Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Farmer Directory
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            A directory of all farmers under your supervision. You have{' '}
                            <span className="text-blue-400 font-semibold">{farmers.length} assigned farmers</span>.
                        </p>
                    </div>
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by farmer or farm name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Farmers Grid */}
            {filteredFarmers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFarmers.map(farmer => (
                        <Card key={farmer._id} className="flex flex-col border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between pb-3">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {farmer.farmOwner.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{farmer.farmOwner}</CardTitle>
                                        <CardDescription>{farmer.farmName}</CardDescription>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleViewAnimalsClick(farmer)}>View Animals</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleReportClick(farmer)} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                                            <ShieldAlert className="mr-2 h-4 w-4" /> Report Non-Compliance
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="flex-grow pt-0">
                                <div className="flex justify-start gap-2 border-t pt-4">
                                    <Button asChild variant="outline" size="sm" className="flex-1"><a href={`tel:${farmer.phoneNumber}`}><Phone className="mr-2 h-4 w-4" /> Call</a></Button>
                                    <Button asChild variant="outline" size="sm" className="flex-1"><a href={`mailto:${farmer.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-12">
                        <div className="text-center">
                            <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-600">No farmers found</p>
                            <p className="text-sm text-gray-500 mt-2">Farmers will appear here after they sign up using your Vet ID.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <FarmerAnimalsDialog
                isOpen={!!selectedFarmer && !isReportDialogOpen && !treatmentAnimal}
                onClose={closeDialogs}
                farmer={selectedFarmer}
                animals={farmerAnimals}
                loading={animalsLoading}
                onAddTreatment={(animal) => handleAddTreatment(selectedFarmer, animal)}
            />
            <ReportFarmerDialog isOpen={isReportDialogOpen} onClose={closeDialogs} farmer={selectedFarmer} onSubmit={handleReportSubmit} />
            <AddTreatmentDialog
                isOpen={!!treatmentAnimal}
                onClose={() => setTreatmentAnimal(null)}
                farmer={selectedFarmer}
                animal={treatmentAnimal}
                onSuccess={handleTreatmentSuccess}
            />
        </div>
    );
};

const FarmerAnimalsDialog = ({ isOpen, onClose, farmer, animals, loading, onAddTreatment }) => {
    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Animal Registry for {farmer?.farmName}</DialogTitle>
                    <CardDescription>Select an animal to add a treatment record.</CardDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="w-8 h-8 border-4 border-gray-200 rounded-full border-t-blue-600 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tag ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Species</TableHead>
                                    <TableHead>Age</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {animals.length > 0 ? animals.map(animal => (
                                    <TableRow key={animal._id}>
                                        <TableCell className="font-medium">{animal.tagId}</TableCell>
                                        <TableCell>{animal.name || 'N/A'}</TableCell>
                                        <TableCell>{animal.species}</TableCell>
                                        <TableCell>{calculateAge(animal.dob)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                className="bg-teal-600 hover:bg-teal-700"
                                                onClick={() => onAddTreatment(animal)}
                                            >
                                                <Syringe className="h-4 w-4 mr-1" />
                                                Add Treatment
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan="5" className="text-center h-24">This farmer has not logged any animals yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ReportFarmerDialog = ({ isOpen, onClose, farmer, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!reason || !details) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a reason and provide details.' });
            return;
        }
        onSubmit({ farmerId: farmer._id, reason, details });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report Non-Compliance: {farmer?.farmName}</DialogTitle>
                    <DialogDescription>This report will be sent to the regulatory authority for review. Please be specific and professional.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Report</Label>
                        <Select onValueChange={setReason} value={reason}>
                            <SelectTrigger id="reason"><SelectValue placeholder="Select a reason..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Suspected Overuse of Antibiotics">Suspected Overuse of Antibiotics</SelectItem>
                                <SelectItem value="Poor Record-Keeping">Poor Record-Keeping</SelectItem>
                                <SelectItem value="Failure to Follow Withdrawal Periods">Failure to Follow Withdrawal Periods</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="details">Specific Details</Label>
                        <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Provide specific details, dates, and observations..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={handleSubmit}>Submit Report</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AddTreatmentDialog = ({ isOpen, onClose, farmer, animal, onSuccess }) => {
    const [formData, setFormData] = useState({
        drugName: '',
        drugClass: 'Unclassified',
        dose: '',
        route: 'Intramuscular',
        withdrawalDays: '',
        withdrawalStartDate: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                drugName: '',
                drugClass: 'Unclassified',
                dose: '',
                route: 'Intramuscular',
                withdrawalDays: '',
                withdrawalStartDate: new Date().toISOString().split('T')[0],
                notes: ''
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.drugName || !formData.withdrawalDays) {
            toast({ variant: 'destructive', title: 'Error', description: 'Drug name and withdrawal period are required.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await addTreatmentByVet({
                farmerId: farmer._id,
                animalId: animal.tagId,
                ...formData
            });
            onSuccess();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to add treatment. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !animal) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                            <Syringe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle>Add Treatment</DialogTitle>
                            <DialogDescription>
                                For {animal?.name || animal?.tagId} ({farmer?.farmOwner})
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Animal Info */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-xl border">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Animal:</span>
                                <span className="font-medium">{animal?.tagId} - {animal?.name || 'Unnamed'}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-500">Species:</span>
                                <span>{animal?.species}</span>
                            </div>
                        </div>

                        {/* Drug Name */}
                        <div className="space-y-2">
                            <Label htmlFor="drugName">Drug Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="drugName"
                                value={formData.drugName}
                                onChange={(e) => setFormData(prev => ({ ...prev, drugName: e.target.value }))}
                                placeholder="e.g., Amoxicillin"
                            />
                        </div>

                        {/* Drug Class */}
                        <div className="space-y-2">
                            <Label htmlFor="drugClass">WHO AWaRe Class</Label>
                            <Select
                                value={formData.drugClass}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, drugClass: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Access">Access (Low resistance risk)</SelectItem>
                                    <SelectItem value="Watch">Watch (Higher resistance risk)</SelectItem>
                                    <SelectItem value="Reserve">Reserve (Last resort)</SelectItem>
                                    <SelectItem value="Unclassified">Unclassified</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dose and Route */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dose">Dose</Label>
                                <Input
                                    id="dose"
                                    value={formData.dose}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                                    placeholder="e.g., 10mg/kg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="route">Route</Label>
                                <Select
                                    value={formData.route}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, route: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Oral">Oral</SelectItem>
                                        <SelectItem value="Intramuscular">Intramuscular (IM)</SelectItem>
                                        <SelectItem value="Subcutaneous">Subcutaneous (SC)</SelectItem>
                                        <SelectItem value="Intravenous">Intravenous (IV)</SelectItem>
                                        <SelectItem value="Topical">Topical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Withdrawal Period */}
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-3">
                            <h4 className="font-medium text-orange-800 flex items-center gap-2">
                                Withdrawal Period
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="withdrawalDays">Duration (Days) <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="withdrawalDays"
                                        type="number"
                                        min="1"
                                        value={formData.withdrawalDays}
                                        onChange={(e) => setFormData(prev => ({ ...prev, withdrawalDays: e.target.value }))}
                                        placeholder="e.g., 14"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="withdrawalStartDate">Start Date</Label>
                                    <Input
                                        id="withdrawalStartDate"
                                        type="date"
                                        value={formData.withdrawalStartDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, withdrawalStartDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                            {formData.withdrawalDays && (
                                <p className="text-sm text-orange-700">
                                    Products from this animal cannot be sold until{' '}
                                    <strong>
                                        {new Date(new Date(formData.withdrawalStartDate).getTime() + formData.withdrawalDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                    </strong>
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional notes about this treatment..."
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-teal-600 hover:bg-teal-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Syringe className="mr-2 h-4 w-4" />
                                    Save Treatment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FarmerDirectoryPage;