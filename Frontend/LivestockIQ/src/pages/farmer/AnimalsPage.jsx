// frontend/src/pages/farmer/AnimalsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, QrCode, Trash2, FileText, Edit, BrainCircuit, Loader2, Search, Calendar, Weight, User2 } from "lucide-react";
import BarcodeScannerDialog from "../../components/animals/BarcodeScannerDialog";
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';
import { getAnimals, addAnimal, updateAnimal, deleteAnimal } from '../../services/animalService';
import { getAnimalHealthTip } from '../../services/aiService';
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

// Species image mapping
const getSpeciesImage = (species) => {
    const map = {
        'Cattle': '/animals/cow.png',
        'Buffalo': '/animals/buffalo.png',
        'Sheep': '/animals/sheep.png',
        'Goat': '/animals/goat.png',
        'Pig': '/animals/pig.png',
        'Horse': '/animals/horse.png',
        'Yak': '/animals/yak.png',
        'Ox': '/animals/ox.png'
    };
    return map[species] || '/animals/cow.png';
};

// Status badge component
const StatusBadge = ({ status }) => {
    const config = {
        'Active': { color: 'bg-green-100 text-green-800 border-green-300' },
        'Sold': { color: 'bg-blue-100 text-blue-800 border-blue-300' },
        'Culled': { color: 'bg-orange-100 text-orange-800 border-orange-300' },
    };
    const finalConfig = config[status] || config['Active'];
    return <Badge className={`border ${finalConfig.color}`}>{status}</Badge>;
};

// Animal Card Component
const AnimalCard = ({ animal, onEdit, onSetStatus, onDelete, onViewHistory, onViewTip }) => {
    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                            src={getSpeciesImage(animal.species)}
                            alt={animal.species}
                            className="w-12 h-12 object-contain"
                        />
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{animal.tagId}</CardTitle>
                            {animal.name && (
                                <CardDescription className="truncate">{animal.name}</CardDescription>
                            )}
                        </div>
                    </div>
                    <StatusBadge status={animal.status} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Animal Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                            <User2 className="h-3 w-3" />
                            Species
                        </div>
                        <div className="font-semibold text-sm">{animal.species}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                            <User2 className="h-3 w-3" />
                            Gender
                        </div>
                        <div className="font-semibold text-sm">{animal.gender || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                            <Calendar className="h-3 w-3" />
                            Age
                        </div>
                        <div className="font-semibold text-sm">{calculateAge(animal.dob)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                            <Weight className="h-3 w-3" />
                            Weight
                        </div>
                        <div className="font-semibold text-sm">{animal.weight || 'N/A'}</div>
                    </div>
                </div>

                {/* Notes if present */}
                {animal.notes && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded p-2 border border-slate-200">
                        <span className="font-semibold">Notes: </span>{animal.notes}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-2 pt-4 border-t">
                <Button onClick={onEdit} variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button onClick={onViewHistory} variant="outline" size="sm" className="flex-1">
                    <FileText className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">History</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="px-2">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={onViewTip} className="text-blue-600 focus:bg-blue-50 focus:text-blue-700">
                            <BrainCircuit className="mr-2 h-4 w-4" />AI Health Tip
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSetStatus("Sold")} className="text-green-600 focus:bg-green-50 focus:text-green-700">
                            Mark as Sold
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSetStatus("Culled")} className="text-orange-600 focus:bg-orange-50 focus:text-orange-700">
                            Mark as Culled
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                            <Trash2 className="mr-2 h-4 w-4" />Delete Record
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
};

const AnimalsPage = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const [viewingHistoryOf, setViewingHistoryOf] = useState(null);
    const [tipAnimal, setTipAnimal] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const { toast } = useToast();

    const fetchAnimals = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAnimals();
            setAnimals(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || error.message || "Failed to load animal data."
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAnimals();
    }, [fetchAnimals]);

    const handleSaveAnimal = async (animalData) => {
        try {
            if (editingAnimal) {
                await updateAnimal(editingAnimal._id, animalData);
                toast({ title: "Success", description: "Animal profile updated successfully." });
            } else {
                await addAnimal(animalData);
                toast({ title: "Success", description: "New animal added successfully." });
            }
            fetchAnimals();
            setIsFormOpen(false);
            setEditingAnimal(null);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || 'Failed to save animal.'
            });
        }
    };

    const handleEditClick = (animal) => {
        setEditingAnimal(animal);
        setIsFormOpen(true);
    };

    const handleSetStatus = async (animalId, status) => {
        try {
            await updateAnimal(animalId, { status });
            toast({ title: "Status Updated", description: `Animal marked as ${status}.` });
            fetchAnimals();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to update status."
            });
        }
    };

    const handleDeleteAnimal = async (animalId) => {
        if (window.confirm(`Are you sure you want to delete this record? This action cannot be undone.`)) {
            try {
                await deleteAnimal(animalId);
                toast({ title: "Success", description: "Animal record deleted." });
                fetchAnimals();
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.response?.data?.message || "Failed to delete animal."
                });
            }
        }
    };

    const handleViewTipClick = (animal) => {
        setTipAnimal(animal);
    };

    // Filter animals based on search and status
    const filteredAnimals = animals.filter(animal => {
        const matchesSearch = searchTerm === "" ||
            animal.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (animal.name && animal.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "all" || animal.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <div className="text-center p-8">Loading animal registry...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Animals & Herd Management</h1>
                    <p className="mt-1 text-gray-600">View, add, and manage all animals on your farm.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                    setIsFormOpen(isOpen);
                    if (!isOpen) setEditingAnimal(null);
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Animal
                        </Button>
                    </DialogTrigger>
                    {isFormOpen && (
                        <AnimalFormDialog
                            onSave={handleSaveAnimal}
                            animal={editingAnimal}
                            onClose={() => setIsFormOpen(false)}
                        />
                    )}
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-grow">
                            <CardTitle>Animal Registry</CardTitle>
                            <CardDescription>A complete list of your livestock.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                            <div className="w-full sm:w-40">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter status..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Sold">Sold</SelectItem>
                                        <SelectItem value="Culled">Culled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search by Tag ID or Name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredAnimals.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredAnimals.map((animal) => (
                                <AnimalCard
                                    key={animal._id}
                                    animal={animal}
                                    onEdit={() => handleEditClick(animal)}
                                    onSetStatus={(status) => handleSetStatus(animal._id, status)}
                                    onDelete={() => handleDeleteAnimal(animal._id)}
                                    onViewHistory={() => setViewingHistoryOf(animal.tagId)}
                                    onViewTip={() => handleViewTipClick(animal)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <img
                                src="/animals/cow.png"
                                alt="No animals"
                                className="w-24 h-24 mx-auto mb-4 opacity-50"
                            />
                            <p className="text-lg font-medium text-gray-600">No animals found</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {searchTerm || statusFilter !== "all"
                                    ? "Try adjusting your search or filter criteria."
                                    : "Add your first animal to get started."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Animal History Dialog */}
            <AnimalHistoryDialog
                animalId={viewingHistoryOf}
                isOpen={!!viewingHistoryOf}
                onClose={() => setViewingHistoryOf(null)}
            />

            {/* AI Health Tip Dialog */}
            <HealthTipDialog
                animal={tipAnimal}
                isOpen={!!tipAnimal}
                onClose={() => setTipAnimal(null)}
            />
        </div>
    );
};

const AnimalFormDialog = ({ onSave, animal, onClose }) => {
    const [formData, setFormData] = useState({
        tagId: animal?.tagId || "",
        name: animal?.name || "",
        species: animal?.species || "",
        gender: animal?.gender || "",
        weight: animal?.weight ? animal.weight.split(" ")[0] : "",
        weightUnit: animal?.weight ? animal.weight.split(" ")[1] : "kg",
        notes: animal?.notes || "",
        dob: animal?.dob ? new Date(animal.dob).toISOString().split('T')[0] : "",
    });
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id, value) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const onScanSuccess = (decodedText) => {
        setFormData((prev) => ({ ...prev, tagId: decodedText }));
        setIsScannerOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            dob: formData.dob ? new Date(formData.dob) : null,
            weight: formData.weight ? `${formData.weight} ${formData.weightUnit}` : "",
            status: animal?.status || "Active",
        };
        onSave(submitData);
    };

    return (
        <>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{animal ? "Edit Animal Profile" : "Add New Animal"}</DialogTitle>
                    <DialogDescription>
                        {animal ? "Update the details for this animal." : "Enter the details for the new animal below."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="tagId">Official 12-Digit Tag ID</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tagId"
                                    name="tagId"
                                    value={formData.tagId}
                                    onChange={handleChange}
                                    required
                                    disabled={!!animal}
                                    placeholder="e.g., 342987123456"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsScannerOpen(true)}
                                    disabled={!!animal}
                                >
                                    <QrCode className="h-5 w-5" />
                                    <span className="sr-only">Scan Tag</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Animal Name (Optional)</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Gauri"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="species">Species</Label>
                            <Select
                                name="species"
                                value={formData.species}
                                onValueChange={(v) => handleSelectChange("species", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a species" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cattle">Cattle</SelectItem>
                                    <SelectItem value="Sheep">Sheep</SelectItem>
                                    <SelectItem value="Goat">Goat</SelectItem>
                                    <SelectItem value="Pig">Pig</SelectItem>
                                    <SelectItem value="Horse">Horse</SelectItem>
                                    <SelectItem value="Buffalo">Buffalo</SelectItem>
                                    <SelectItem value="Yak">Yak</SelectItem>
                                    <SelectItem value="Ox">Ox</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                                name="gender"
                                value={formData.gender}
                                onValueChange={(v) => handleSelectChange("gender", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="weight">Weight</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="weight"
                                    name="weight"
                                    type="number"
                                    value={formData.weight}
                                    onChange={handleChange}
                                />
                                <Select
                                    name="weightUnit"
                                    value={formData.weightUnit}
                                    onValueChange={(v) => handleSelectChange("weightUnit", v)}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lbs">lbs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any specific details..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">{animal ? "Save Changes" : "Add Animal"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
            {isScannerOpen && (
                <BarcodeScannerDialog
                    onClose={() => setIsScannerOpen(false)}
                    onScanSuccess={onScanSuccess}
                />
            )}
        </>
    );
};

// AI Health Tip Dialog Component
const HealthTipDialog = ({ animal, isOpen, onClose }) => {
    const [tip, setTip] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && animal) {
            const fetchTip = async () => {
                setIsLoading(true);
                setTip('');
                try {
                    const data = await getAnimalHealthTip(animal._id);
                    setTip(data.tip);
                } catch (error) {
                    setTip('Sorry, I was unable to generate a health tip at this time. Please try again later.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTip();
        }
    }, [isOpen, animal]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-blue-600" />
                        AI Health Tip for {animal?.name || animal?.tagId}
                    </DialogTitle>
                    <DialogDescription>
                        A personalized tip based on this animal's profile and health history.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-md border border-blue-200">
                            {tip}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AnimalsPage;