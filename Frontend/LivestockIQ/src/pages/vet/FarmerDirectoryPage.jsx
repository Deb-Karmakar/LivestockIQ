// frontend/src/pages/vet/FarmerDirectoryPage.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Phone, Mail, Loader2, MoreVertical, ShieldAlert } from 'lucide-react';
import { axiosInstance } from '../../contexts/AuthContext';
import { getAnimalsForFarmer, reportFarmer } from '../../services/vetService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '../../hooks/use-toast';

// Helper function (unchanged)
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
    const { toast } = useToast();

    useEffect(() => {
        const fetchFarmers = async () => {
            try {
                setLoading(true);
                const { data } = await axiosInstance.get('vets/my-farmers');
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
                    <Card key={farmer._id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>{farmer.farmOwner.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>{farmer.farmOwner}</CardTitle>
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
                        <CardContent className="flex-grow">
                             <div className="flex justify-start gap-2 border-t pt-4">
                                <Button asChild variant="outline" size="sm"><a href={`tel:${farmer.phoneNumber}`}><Phone className="mr-2 h-4 w-4" /> Call</a></Button>
                                <Button asChild variant="outline" size="sm"><a href={`mailto:${farmer.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {/* CORRECTED: This is the proper way to render the empty state message */}
            {filteredFarmers.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 col-span-full">
                    <p>No farmers found.</p>
                    <p className="text-sm">Farmers will appear here after they sign up using your Vet ID.</p>
                </div>
            )}
            
            <FarmerAnimalsDialog isOpen={!!selectedFarmer && !isReportDialogOpen} onClose={closeDialogs} farmer={selectedFarmer} animals={farmerAnimals} loading={animalsLoading}/>
            <ReportFarmerDialog isOpen={isReportDialogOpen} onClose={closeDialogs} farmer={selectedFarmer} onSubmit={handleReportSubmit} />
        </div>
    );
};

// This component remains unchanged
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

// This component remains unchanged
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

export default FarmerDirectoryPage;