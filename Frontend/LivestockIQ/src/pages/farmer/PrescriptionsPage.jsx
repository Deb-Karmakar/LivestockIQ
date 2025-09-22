import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Stethoscope, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';

// --- Mock Data ---
const mockVets = {
    'VET-01': { name: 'Dr. Sharma', avatar: 'https://i.pravatar.cc/40?u=vet1' },
    'VET-02': { name: 'Dr. Gupta', avatar: 'https://i.pravatar.cc/40?u=vet2' },
};

const initialPrescriptions = [
    {
        id: 'PRES-003',
        vetId: 'VET-01',
        animalId: '342987123456',
        drugName: 'Tylosin',
        notes: 'Administer for 5 days for respiratory infection. Observe for improvement.',
        date: new Date('2025-09-16'),
        status: 'New',
    },
    {
        id: 'PRES-002',
        vetId: 'VET-02',
        animalId: '458921789123',
        drugName: 'Ivermectin',
        notes: 'Follow-up deworming treatment as discussed.',
        date: new Date('2025-09-12'),
        status: 'Completed',
    },
    {
        id: 'PRES-001',
        vetId: 'VET-01',
        animalId: '342987123457',
        drugName: 'Amoxicillin',
        notes: 'Standard course for bacterial infection.',
        date: new Date('2025-09-05'),
        status: 'Completed',
    },
];

// --- Helper Components ---
const StatusBadge = ({ status }) => {
    const config = {
        'New': { text: 'New Prescription', color: 'bg-blue-100 text-blue-800', icon: <Stethoscope className="h-3 w-3" /> },
        'Completed': { text: 'Treatment Logged', color: 'bg-green-100 text-green-800', icon: <Check className="h-3 w-3" /> },
    }[status];
    return <Badge className={`flex items-center gap-1.5 ${config.color} hover:${config.color}`}>{config.icon}{config.text}</Badge>;
};

// --- Main Prescriptions Page Component ---
const PrescriptionsPage = () => {
    const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredPrescriptions = useMemo(() => {
        if (statusFilter === 'all') {
            return prescriptions;
        }
        return prescriptions.filter(p => p.status === statusFilter);
    }, [prescriptions, statusFilter]);

    const handleStartTreatment = (prescription) => {
        // In a real app, this would open the "Add Treatment" dialog
        // and pre-fill it with data from the prescription object.
        alert(`Starting treatment for Animal ${prescription.animalId} with ${prescription.drugName}.`);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Veterinary Prescriptions</h1>
                    <p className="mt-1 text-gray-600">Review and act on prescriptions from your vet.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={setStatusFilter} defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Prescriptions List */}
            <div className="space-y-4">
                {filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map(prescription => {
                        const vet = mockVets[prescription.vetId];
                        return (
                            <Card key={prescription.id}>
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={vet.avatar} />
                                            <AvatarFallback>{vet.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">Prescription from {vet.name}</CardTitle>
                                            <CardDescription>Received on {format(prescription.date, 'MMM d, yyyy')}</CardDescription>
                                        </div>
                                    </div>
                                    <StatusBadge status={prescription.status} />
                                </CardHeader>
                                <CardContent>
                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="font-semibold">Animal ID</p>
                                                <p className="text-gray-600">{prescription.animalId}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold">Prescribed Drug</p>
                                                <p className="text-gray-600">{prescription.drugName}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="font-semibold">Veterinarian's Notes</p>
                                                <p className="text-gray-600">{prescription.notes}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4 border-t pt-4">
                                        <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> View Attachment</Button>
                                        {prescription.status === 'New' && (
                                            <Button onClick={() => handleStartTreatment(prescription)}>
                                                Start Treatment
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>No prescriptions match the selected filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrescriptionsPage;

