// Frontend/src/pages/vet/OfflineTreatmentsPage.jsx
//Page for vets to log treatments for non-registered farmers

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Trash2, Send, Users, Pill, FileText, Search, Filter,
    Calendar, Mail, MailX, RefreshCw, Eye, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import {
    createOfflineTreatment,
    getOfflineTreatments,
    deleteOfflineTreatment,
    resendPrescriptionEmail
} from '../../services/offlineTreatmentService';

const SPECIES_OPTIONS = ['Cattle', 'Buffalo', 'Sheep', 'Goat', 'Pig', 'Poultry', 'Other'];
const ROUTE_OPTIONS = ['Oral', 'Injection', 'Topical', 'IV', 'IM', 'SC', 'Other'];

const OfflineTreatmentsPage = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('create');
    const [loading, setLoading] = useState(false);
    const [treatments, setTreatments] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ search: '', species: 'all', page: 1 });

    // Form state
    const [formData, setFormData] = useState({
        farmerName: '',
        farmerPhone: '',
        farmerAddress: '',
        farmName: '',
        animalTagId: '',
        animalSpecies: 'Cattle',
        animalBreed: '',
        animalAge: '',
        animalWeight: '',
        diagnosis: '',
        symptoms: '',
        generalNotes: '',
        followUpDate: '',
        totalCost: ''
    });

    const [prescriptions, setPrescriptions] = useState([{
        drugName: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '',
        withdrawalPeriod: '',
        route: 'Oral',
        notes: ''
    }]);

    useEffect(() => {
        if (activeTab === 'past') {
            fetchTreatments();
        }
    }, [activeTab, filters]);

    const fetchTreatments = async () => {
        try {
            setLoading(true);
            const data = await getOfflineTreatments(filters);
            setTreatments(data.data || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1 });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load treatments' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddPrescription = () => {
        setPrescriptions([...prescriptions, {
            drugName: '',
            dosage: '',
            frequency: 'Once daily',
            duration: '',
            withdrawalPeriod: '',
            route: 'Oral',
            notes: ''
        }]);
    };

    const handleRemovePrescription = (index) => {
        setPrescriptions(prescriptions.filter((_, i) => i !== index));
    };

    const handlePrescriptionChange = (index, field, value) => {
        const updated = [...prescriptions];
        updated[index][field] = value;
        setPrescriptions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.farmerName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Farmer name is required' });
            return;
        }
        if (!formData.diagnosis.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Diagnosis is required' });
            return;
        }
        if (prescriptions.some(p => !p.drugName.trim() || !p.dosage.trim())) {
            toast({ variant: 'destructive', title: 'Error', description: 'All prescriptions must have drug name and dosage' });
            return;
        }

        try {
            setLoading(true);
            const submitData = {
                ...formData,
                animalWeight: formData.animalWeight ? parseFloat(formData.animalWeight) : undefined,
                totalCost: formData.totalCost ? parseFloat(formData.totalCost) : undefined,
                prescriptions: prescriptions.map(p => ({
                    ...p,
                    withdrawalPeriod: p.withdrawalPeriod ? parseInt(p.withdrawalPeriod) : undefined
                }))
            };

            const result = await createOfflineTreatment(submitData);

            if (result.emailSent) {
                toast({
                    title: 'Success!',
                    description: 'Treatment record created and prescription email sent successfully'
                });
            } else {
                toast({
                    title: 'Partial Success',
                    description: 'Treatment record created but email failed. You can resend it from Past Records.',
                    variant: 'warning'
                });
            }

            // Reset form
            setFormData({
                farmerName: '', farmerPhone: '', farmerAddress: '', farmName: '',
                animalTagId: '', animalSpecies: 'Cattle', animalBreed: '', animalAge: '',
                animalWeight: '', diagnosis: '', symptoms: '', generalNotes: '',
                followUpDate: '', totalCost: ''
            });
            setPrescriptions([{
                drugName: '', dosage: '', frequency: 'Once daily', duration: '',
                withdrawalPeriod: '', route: 'Oral', notes: ''
            }]);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to create treatment' });
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async (id) => {
        try {
            await resendPrescriptionEmail(id);
            toast({ title: 'Success', description: 'Prescription email resent successfully' });
            fetchTreatments();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to resend email' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this treatment record?')) return;

        try {
            await deleteOfflineTreatment(id);
            toast({ title: 'Success', description: 'Treatment record deleted' });
            fetchTreatments();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete treatment' });
        }
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="relative">
                    <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-2">
                        <Users className="w-4 h-4" />
                        <span>Offline Treatment Records</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Non-Registered Farmers</h1>
                    <p className="text-emerald-200">Log treatments for farmers not in the system and receive prescription emails</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create"><Plus className="w-4 h-4 mr-2" />Create Prescription</TabsTrigger>
                    <TabsTrigger value="past"><FileText className="w-4 h-4 mr-2" />Past Records</TabsTrigger>
                </TabsList>

                {/* Create Prescription Tab */}
                <TabsContent value="create">
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6">
                            {/* Farmer Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Farmer Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="farmerName">Farmer Name *</Label>
                                        <Input id="farmerName" value={formData.farmerName} onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="farmerPhone">Phone Number</Label>
                                        <Input id="farmerPhone" value={formData.farmerPhone} onChange={(e) => setFormData({ ...formData, farmerPhone: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label htmlFor="farmName">Farm Name</Label>
                                        <Input id="farmName" value={formData.farmName} onChange={(e) => setFormData({ ...formData, farmName: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label htmlFor="farmerAddress">Address</Label>
                                        <Input id="farmerAddress" value={formData.farmerAddress} onChange={(e) => setFormData({ ...formData, farmerAddress: e.target.value })} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Animal Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Animal Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="animalSpecies">Species *</Label>
                                        <Select value={formData.animalSpecies} onValueChange={(v) => setFormData({ ...formData, animalSpecies: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {SPECIES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="animalTagId">Tag ID (Optional)</Label>
                                        <Input id="animalTagId" value={formData.animalTagId} onChange={(e) => setFormData({ ...formData, animalTagId: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label htmlFor="animalBreed">Breed</Label>
                                        <Input id="animalBreed" value={formData.animalBreed} onChange={(e) => setFormData({ ...formData, animalBreed: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label htmlFor="animalAge">Age</Label>
                                        <Input id="animalAge" placeholder="e.g., 3 years" value={formData.animalAge} onChange={(e) => setFormData({ ...formData, animalAge: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label htmlFor="animalWeight">Weight (kg)</Label>
                                        <Input id="animalWeight" type="number" value={formData.animalWeight} onChange={(e) => setFormData({ ...formData, animalWeight: e.target.value })} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Diagnosis */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Diagnosis & Symptoms</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="diagnosis">Diagnosis *</Label>
                                        <Input id="diagnosis" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="symptoms">Symptoms</Label>
                                        <Textarea id="symptoms" value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} rows={3} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Prescriptions */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Prescriptions</CardTitle>
                                        <Button type="button" onClick={handleAddPrescription} size="sm"><Plus className="w-4 h-4 mr-2" />Add Drug</Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {prescriptions.map((prescription, index) => (
                                        <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold">Drug #{index + 1}</h4>
                                                {prescriptions.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePrescription(index)}><Trash2 className="w-4 h-4" /></Button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Drug Name *</Label>
                                                    <Input value={prescription.drugName} onChange={(e) => handlePrescriptionChange(index, 'drugName', e.target.value)} required />
                                                </div>
                                                <div>
                                                    <Label>Dosage *</Label>
                                                    <Input value={prescription.dosage} onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)} placeholder="e.g., 10ml, 500mg" required />
                                                </div>
                                                <div>
                                                    <Label>Frequency</Label>
                                                    <Input value={prescription.frequency} onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label>Duration</Label>
                                                    <Input value={prescription.duration} onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)} placeholder="e.g., 5 days" />
                                                </div>
                                                <div>
                                                    <Label>Route</Label>
                                                    <Select value={prescription.route} onValueChange={(v) => handlePrescriptionChange(index, 'route', v)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {ROUTE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Withdrawal Period (days)</Label>
                                                    <Input type="number" value={prescription.withdrawalPeriod} onChange={(e) => handlePrescriptionChange(index, 'withdrawalPeriod', e.target.value)} />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label>Notes</Label>
                                                    <Textarea value={prescription.notes} onChange={(e) => handlePrescriptionChange(index, 'notes', e.target.value)} rows={2} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Additional Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Additional Information</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label htmlFor="generalNotes">General Notes</Label>
                                        <Textarea id="generalNotes" value={formData.generalNotes} onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })} rows={3} />
                                    </div>
                                    <div>
                                        <Label htmlFor="followUpDate">Follow-up Date</Label>
                                        <Input id="followUpDate" type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label htmlFor="totalCost">Total Cost (₹)</Label>
                                        <Input id="totalCost" type="number" value={formData.totalCost} onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit */}
                            <Button type="submit" size="lg" disabled={loading} className="w-full">
                                {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                                {loading ? 'Creating...' : 'Submit & Send Email'}
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                {/* Past Records Tab */}
                <TabsContent value="past">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Treatment Records</CardTitle>
                                    <CardDescription>View and manage past offline treatments</CardDescription>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-4">
                                <Input placeholder="Search farmer, phone, diagnosis..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} className="max-w-sm" />
                                <Select value={filters.species} onValueChange={(v) => setFilters({ ...filters, species: v, page: 1 })}>
                                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Species</SelectItem>
                                        {SPECIES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Farmer</TableHead>
                                        <TableHead>Animal</TableHead>
                                        <TableHead>Diagnosis</TableHead>
                                        <TableHead>Email Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {treatments.map((treatment) => (
                                        <TableRow key={treatment._id}>
                                            <TableCell>{new Date(treatment.treatmentDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{treatment.farmerName}</div>
                                                {treatment.farmerPhone && <div className="text-xs text-gray-500">{treatment.farmerPhone}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <div>{treatment.animalSpecies}</div>
                                                {treatment.animalTagId && <div className="text-xs text-gray-500">{treatment.animalTagId}</div>}
                                            </TableCell>
                                            <TableCell>{treatment.diagnosis}</TableCell>
                                            <TableCell>
                                                {treatment.emailSent ? (
                                                    <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Sent</Badge>
                                                ) : (
                                                    <Badge variant="destructive"><MailX className="w-3 h-3 mr-1" />Failed</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {!treatment.emailSent && (
                                                        <Button size="sm" variant="outline" onClick={() => handleResendEmail(treatment._id)}>
                                                            <RefreshCw className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(treatment._id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-center mt-4 gap-2">
                                <Button variant="outline" disabled={pagination.currentPage <= 1} onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}>Previous</Button>
                                <span className="flex items-center px-4">Page {pagination.currentPage} of {pagination.totalPages}</span>
                                <Button variant="outline" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}>Next</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OfflineTreatmentsPage;
