import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ShieldAlert, ShoppingCart } from 'lucide-react';
import { addDays, differenceInDays } from 'date-fns';

// --- Mock Data ---
// In a real app, this would be a combination of your animals and treatments data.
const mockAnimalStatus = [
    { id: '342987123456', name: 'Gauri', species: 'Cattle', lastTreatmentDate: new Date('2025-09-14'), withdrawalDays: 7 },
    { id: '342987123457', name: 'Nandi', species: 'Cattle', lastTreatmentDate: new Date('2025-08-01'), withdrawalDays: 14 },
    { id: '458921789123', name: 'Sheru', species: 'Goat', lastTreatmentDate: new Date('2025-09-15'), withdrawalDays: 28 },
    { id: 'P-101', name: 'Batch A', species: 'Poultry', lastTreatmentDate: null, withdrawalDays: 0 },
];

// --- Helper to calculate withdrawal status ---
const getSaleStatus = (animal) => {
    if (!animal.lastTreatmentDate) return { isSafe: true, daysLeft: 0 };
    const withdrawalEndDate = addDays(animal.lastTreatmentDate, animal.withdrawalDays);
    const daysLeft = differenceInDays(withdrawalEndDate, new Date());
    return {
        isSafe: daysLeft <= 0,
        daysLeft: daysLeft > 0 ? daysLeft : 0,
    };
};

// --- Main Sell Page Component ---
const SellPage = () => {
    const [selectedAnimal, setSelectedAnimal] = useState(null);

    const animalsWithStatus = useMemo(() => mockAnimalStatus.map(animal => ({
        ...animal,
        ...getSaleStatus(animal)
    })), [mockAnimalStatus]);

    const availableAnimals = animalsWithStatus.filter(a => a.isSafe);
    const unavailableAnimals = animalsWithStatus.filter(a => !a.isSafe);
    
    const handleLogSale = (formData) => {
        console.log("Sale Logged:", formData);
        alert(`Sale of ${formData.quantity} ${formData.unit} of ${formData.product} from animal ${formData.animalId} has been logged!`);
        setSelectedAnimal(null); // Close the dialog
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Sell Products</h1>
                <p className="mt-1 text-gray-600">Log sales for animals that have completed their withdrawal periods.</p>
            </div>

            {/* Section 1: Available for Sale */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3 text-green-600">
                        <ShieldCheck className="w-6 h-6" />
                        <div>
                            <CardTitle>Available for Sale ({availableAnimals.length})</CardTitle>
                            <CardDescription>These animals have completed all withdrawal periods.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableAnimals.map(animal => (
                        <Card key={animal.id} className="flex flex-col">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base">{animal.name}</CardTitle>
                                <CardDescription>ID: {animal.id}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-end">
                                <Button className="w-full" onClick={() => setSelectedAnimal(animal)}>
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Log Sale
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
            
            <Separator />

            {/* Section 2: Under Withdrawal Period */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3 text-red-600">
                        <ShieldAlert className="w-6 h-6" />
                        <div>
                            <CardTitle>Not Available for Sale ({unavailableAnimals.length})</CardTitle>
                            <CardDescription>These animals are currently within a withdrawal period.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {unavailableAnimals.map(animal => (
                        <Card key={animal.id} className="bg-gray-50 opacity-70">
                            <CardHeader>
                                <CardTitle className="text-base">{animal.name}</CardTitle>
                                <CardDescription>ID: {animal.id}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center bg-red-100 text-red-800 p-2 rounded-md">
                                    <p className="font-bold text-lg">{animal.daysLeft} days</p>
                                    <p className="text-xs">left on withdrawal</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            {/* Sale Logging Dialog */}
            <SellFormDialog 
                animal={selectedAnimal}
                onClose={() => setSelectedAnimal(null)}
                onSave={handleLogSale}
            />
        </div>
    );
};


// --- Sell Form Dialog Sub-component ---
const SellFormDialog = ({ animal, onClose, onSave }) => {
    if (!animal) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            animalId: animal.id,
            product: formData.get('product'),
            quantity: formData.get('quantity'),
            unit: formData.get('unit'),
            saleDate: new Date(),
        };
        onSave(data);
    };

    return (
        <Dialog open={!!animal} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Sale for {animal.name} (ID: {animal.id})</DialogTitle>
                    <DialogDescription>Enter the details of the product being sold.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">Product Type</Label>
                            <Select name="product" required>
                                <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Milk">Milk</SelectItem>
                                    <SelectItem value="Meat">Meat</SelectItem>
                                    <SelectItem value="Eggs">Eggs</SelectItem>
                                    <SelectItem value="Live Animal">Live Animal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input id="quantity" name="quantity" type="number" placeholder="e.g., 20" required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Input id="unit" name="unit" placeholder="e.g., Liters" required/>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Log Sale</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export default SellPage;