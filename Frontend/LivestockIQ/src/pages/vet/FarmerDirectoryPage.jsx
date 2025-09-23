// frontend/src/pages/vet/FarmerDirectoryPage.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Phone, Mail, Loader2 } from 'lucide-react';
import { axiosInstance } from '../../contexts/AuthContext';
import { getAnimalsForFarmer } from '../../services/vetService'; // Import the new service
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '../../hooks/use-toast';

// Helper function to calculate age
const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const ageDifMs = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(ageDifMs);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();
    if (years > 0) return `${years} year${years > 1 ? "s" : ""}, ${months} mo`;
    return `${months} month${months > 1 ? "s" : ""}`;
};


// --- Main Farmer Directory Page Component ---
const FarmerDirectoryPage = () => {
    const [farmers, setFarmers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    
    // NEW: State for managing the animals dialog
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [farmerAnimals, setFarmerAnimals] = useState([]);
    const [animalsLoading, setAnimalsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchFarmers = async () => {
            try {
                setLoading(true);
                const { data } = await axiosInstance.get('vets/my-farmers');
                setFarmers(data);
            } catch (error) {
                console.error("Failed to fetch farmers:", error);
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
    
    // NEW: Handler to open dialog and fetch animals
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
    
    const closeDialog = () => {
        setSelectedFarmer(null);
        setFarmerAnimals([]);
    };

    if (loading) return <div>Loading farmers...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Farmer Directory</h1>
                    <p className="mt-1 text-gray-600">A directory of all farmers under your supervision.</p>
                </div>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input placeholder="Search by farmer or farm name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFarmers.map(farmer => (
                    // UPDATED: Card is now clickable
                    <Card key={farmer._id} className="flex flex-col transition-shadow hover:shadow-lg">
                        <div className="flex-grow cursor-pointer" onClick={() => handleViewAnimalsClick(farmer)}>
                            <CardHeader className="flex flex-col items-center text-center">
                                <Avatar className="h-20 w-20 mb-4">
                                    <AvatarFallback>{farmer.farmOwner.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <CardTitle>{farmer.farmOwner}</CardTitle>
                                <CardDescription>{farmer.farmName}</CardDescription>
                            </CardHeader>
                        </div>
                        <CardContent>
                             <div className="flex justify-center gap-2 border-t pt-4">
                                <Button asChild variant="outline" size="sm">
                                    <a href={`tel:${farmer.phoneNumber}`}><Phone className="mr-2 h-4 w-4" /> Call</a>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <a href={`mailto:${farmer.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
             {filteredFarmers.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                    <p>No farmers found.</p>
                    <p className="text-sm">Farmers will appear here after they sign up using your Vet ID.</p>
                </div>
            )}
            
            {/* NEW: Render the animals dialog */}
            <FarmerAnimalsDialog
                isOpen={!!selectedFarmer}
                onClose={closeDialog}
                farmer={selectedFarmer}
                animals={farmerAnimals}
                loading={animalsLoading}
            />
        </div>
    );
};

// NEW: Dialog component to display a farmer's animals
const FarmerAnimalsDialog = ({ isOpen, onClose, farmer, animals, loading }) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Animal Registry for {farmer?.farmName}</DialogTitle>
                    <CardDescription>A complete list of livestock for {farmer?.farmOwner}.</CardDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tag ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Species</TableHead>
                                    <TableHead>Age</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {animals.length > 0 ? animals.map(animal => (
                                    <TableRow key={animal._id}>
                                        <TableCell className="font-medium">{animal.tagId}</TableCell>
                                        <TableCell>{animal.name || 'N/A'}</TableCell>
                                        <TableCell>{animal.species}</TableCell>
                                        <TableCell>{calculateAge(animal.dob)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan="4" className="text-center h-24">This farmer has not logged any animals yet.</TableCell>
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

export default FarmerDirectoryPage;