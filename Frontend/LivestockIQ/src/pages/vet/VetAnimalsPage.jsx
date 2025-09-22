import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, History } from 'lucide-react';
import { format } from 'date-fns';

// --- Mock Data ---
const mockAnimals = [
    { id: '342987123456', name: 'Gauri', species: 'Cattle', farmerName: 'Rahul Sharma', farmName: 'Green Valley Farms', status: 'Active' },
    { id: '342987123457', name: 'Nandi', species: 'Cattle', farmerName: 'Rahul Sharma', farmName: 'Green Valley Farms', status: 'Active' },
    { id: 'C-203', name: 'Ganga', species: 'Cattle', farmerName: 'Sunita Devi', farmName: 'Sunrise Dairy', status: 'Active' },
    { id: '458921789123', name: 'Sheru', species: 'Goat', farmerName: 'Rahul Sharma', farmName: 'Green Valley Farms', status: 'Sold' },
];

const mockTreatments = [
    { id: 'TMT-001', animalId: '342987123456', drugName: 'Enrofloxacin', date: new Date('2025-09-14'), signed: true },
    { id: 'TMT-002', animalId: '342987123457', drugName: 'Amoxicillin', date: new Date('2025-09-05'), signed: true },
    { id: 'TMT-003', animalId: '458921789123', drugName: 'Ivermectin', date: new Date('2025-08-20'), signed: false },
    { id: 'TMT-005', animalId: 'C-203', drugName: 'Tylosin', date: new Date('2025-09-16'), signed: true },
    { id: 'TMT-006', animalId: '342987123456', drugName: 'Painkiller', date: new Date('2025-07-22'), signed: true },
];


// --- Main Vet's Animals Page Component ---
const VetAnimalsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAnimal, setSelectedAnimal] = useState(null);

    const filteredAnimals = useMemo(() => mockAnimals.filter(a =>
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.farmerName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm]);

    const animalTreatments = useMemo(() => {
        if (!selectedAnimal) return [];
        return mockTreatments.filter(t => t.animalId === selectedAnimal.id);
    }, [selectedAnimal]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Assigned Animals</h1>
                <p className="mt-1 text-gray-600">A read-only list of all animals under your supervision.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Animal Registry</CardTitle>
                            <CardDescription>
                                You are supervising {mockAnimals.length} animals across various farms.
                            </CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search by Tag ID, Name, or Farmer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tag ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Species</TableHead>
                                <TableHead>Farmer / Farm</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAnimals.map(animal => (
                                <TableRow key={animal.id}>
                                    <TableCell className="font-medium">{animal.id}</TableCell>
                                    <TableCell>{animal.name}</TableCell>
                                    <TableCell>{animal.species}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{animal.farmerName}</div>
                                        <div className="text-sm text-gray-500">{animal.farmName}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={animal.status === 'Active' ? 'secondary' : 'outline'}>
                                            {animal.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedAnimal(animal)}>
                                            <History className="mr-2 h-4 w-4" />
                                            View History
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Treatment History Dialog */}
            <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Treatment History for {selectedAnimal?.name} (ID: {selectedAnimal?.id})</DialogTitle>
                        <DialogDescription>
                            A complete log of all treatments administered to this animal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Drug Name</TableHead>
                                    <TableHead>Signed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {animalTreatments.length > 0 ? (
                                    animalTreatments.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{format(t.date, 'MMM d, yyyy')}</TableCell>
                                            <TableCell>{t.drugName}</TableCell>
                                            <TableCell>
                                                <Badge variant={t.signed ? 'default' : 'destructive'}>
                                                    {t.signed ? 'Yes' : 'No'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">
                                            No treatment history found for this animal.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VetAnimalsPage;