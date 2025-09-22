import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MoreHorizontal, QrCode, Trash2 } from "lucide-react";
import BarcodeScannerDialog from "../../components/animals/BarcodeScannerDialog";
import { getAnimals, addAnimal, updateAnimal, deleteAnimal } from '../../services/animalService';
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

const AnimalsPage = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const { toast } = useToast();
    
    const fetchAnimals = useCallback(async () => {
        try {
            setLoading(true);
            console.log("Fetching animals...");
            const data = await getAnimals();
            console.log("Animals data received:", data);
            setAnimals(data);
        } catch (error) {
            console.error("Error in fetchAnimals:", error);
            console.error("Error response:", error.response);
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

    if (loading) {
        return <div className="text-center p-8">Loading animal registry...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Animals & Herd Management</h1>
                    <p className="mt-1 text-gray-600">View, add, and manage all animals on your farm.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={(isOpen) => { 
                    setIsFormOpen(isOpen); 
                    if (!isOpen) setEditingAnimal(null); 
                }}>
                    <DialogTrigger asChild>
                        <Button className="mt-4 md:mt-0" onClick={() => setIsFormOpen(true)}>
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
                    <CardTitle>Animal Registry</CardTitle>
                    <CardDescription>A complete list of your livestock.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tag ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Species</TableHead>
                                <TableHead>Age</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {animals.map((animal) => (
                                <TableRow key={animal._id}>
                                    <TableCell className="font-medium">{animal.tagId}</TableCell>
                                    <TableCell>{animal.name || 'N/A'}</TableCell>
                                    <TableCell>{animal.species}</TableCell>
                                    <TableCell>{calculateAge(animal.dob)}</TableCell>
                                    <TableCell>{animal.weight || 'N/A'}</TableCell>
                                    <TableCell>{animal.status}</TableCell>
                                    <TableCell className="text-right">
                                        <ActionsDropdown
                                            animal={animal}
                                            onEdit={() => handleEditClick(animal)}
                                            onSetStatus={(status) => handleSetStatus(animal._id, status)}
                                            onDelete={() => handleDeleteAnimal(animal._id)}
                                        />
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
                                    <SelectItem value="Mithun">Mithun</SelectItem>
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

const ActionsDropdown = ({ animal, onEdit, onSetStatus, onDelete }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={onEdit}>Edit Profile</DropdownMenuItem>
                <DropdownMenuItem>View Treatment History</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSetStatus("Sold")} className="text-green-600">
                    Mark as Sold
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetStatus("Culled")} className="text-orange-600">
                    Mark as Culled
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />Delete Record
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default AnimalsPage;