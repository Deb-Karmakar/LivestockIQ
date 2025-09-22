import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FilePlus2, MoreHorizontal, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';

// --- Mock Data ---
const mockFarmers = [
    { id: 'FARM-01', name: 'Rahul Sharma', farm: 'Green Valley Farms' },
    { id: 'FARM-02', name: 'Sunita Devi', farm: 'Sunrise Dairy' },
];
const mockAnimals = [
    { id: '342987123456', farmerId: 'FARM-01' },
    { id: '342987123457', farmerId: 'FARM-01' },
    { id: 'C-203', farmerId: 'FARM-02' },
];
const mockDrugs = ['Enrofloxacin', 'Amoxicillin', 'Ivermectin', 'Tylosin'];
const initialPrescriptions = [
    { id: 'PRES-003', farmerId: 'FARM-01', animalId: '342987123456', drugName: 'Tylosin', date: new Date('2025-09-16'), status: 'Sent' },
    { id: 'PRES-002', farmerId: 'FARM-02', animalId: 'C-203', drugName: 'Ivermectin', date: new Date('2025-09-12'), status: 'Used by Farmer' },
    { id: 'PRES-001', farmerId: 'FARM-01', animalId: '342987123457', drugName: 'Amoxicillin', date: new Date('2025-09-05'), status: 'Used by Farmer' },
];

// --- Main Prescriptions Page Component ---
const VetPrescriptionsPage = () => {
    const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleSavePrescription = (newPrescription) => {
        setPrescriptions(prev => [{ ...newPrescription, id: `PRES-00${prev.length + 1}`, date: new Date(), status: 'Sent' }, ...prev]);
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Manage Prescriptions</h1>
                    <p className="mt-1 text-gray-600">Create, view, and sign digital prescriptions for your farmers.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button><FilePlus2 className="mr-2 h-4 w-4" /> Create New Prescription</Button>
                    </DialogTrigger>
                    <CreatePrescriptionDialog onSave={handleSavePrescription} onClose={() => setIsFormOpen(false)} />
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Prescription History</CardTitle>
                    <CardDescription>A log of all prescriptions you have issued.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Farmer</TableHead>
                                <TableHead>Animal ID</TableHead>
                                <TableHead>Drug</TableHead>
                                <TableHead>Date Issued</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prescriptions.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{mockFarmers.find(f => f.id === p.farmerId)?.name}</TableCell>
                                    <TableCell>{p.animalId}</TableCell>
                                    <TableCell>{p.drugName}</TableCell>
                                    <TableCell>{format(p.date, 'MMM d, yyyy')}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.status === 'Sent' ? 'secondary' : 'default'}>
                                            {p.status === 'Sent' ? <Clock className="h-3 w-3 mr-1.5" /> : <Check className="h-3 w-3 mr-1.5" />}
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Create Prescription Form Dialog ---
const CreatePrescriptionDialog = ({ onSave, onClose }) => {
    const [selectedFarmer, setSelectedFarmer] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            farmerId: formData.get('farmerId'),
            animalId: formData.get('animalId'),
            drugName: formData.get('drugName'),
            dose: formData.get('dose'),
            route: formData.get('route'),
            duration: formData.get('duration'),
            notes: formData.get('notes'),
        };
        onSave(data);
    };
    
    const availableAnimals = useMemo(() => {
        if (!selectedFarmer) return [];
        return mockAnimals.filter(a => a.farmerId === selectedFarmer);
    }, [selectedFarmer]);

    return (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Create New Digital Prescription</DialogTitle>
                <DialogDescription>Select the farmer, animal, and drug to issue a new prescription.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="farmerId">Select Farmer</Label>
                            <Select name="farmerId" onValueChange={setSelectedFarmer} required>
                                <SelectTrigger><SelectValue placeholder="Choose a farmer..." /></SelectTrigger>
                                <SelectContent>{mockFarmers.map(f => <SelectItem key={f.id} value={f.id}>{f.name} ({f.farm})</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="animalId">Select Animal / Herd</Label>
                            <Select name="animalId" disabled={!selectedFarmer} required>
                                <SelectTrigger><SelectValue placeholder="Choose an animal..." /></SelectTrigger>
                                <SelectContent>{availableAnimals.map(a => <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="drugName">Select Drug</Label>
                        <Select name="drugName" required>
                            <SelectTrigger><SelectValue placeholder="Choose a drug..." /></SelectTrigger>
                            <SelectContent>{mockDrugs.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dose">Dose</Label>
                            <Input id="dose" name="dose" placeholder="e.g., 10 mg/kg" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="route">Route</Label>
                            <Input id="route" name="route" placeholder="e.g., Injection" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input id="duration" name="duration" placeholder="e.g., 5 days" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes for Farmer</Label>
                        <Textarea id="notes" name="notes" placeholder="Instructions for administration, observations, etc." />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Sign & Send Prescription</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default VetPrescriptionsPage;
