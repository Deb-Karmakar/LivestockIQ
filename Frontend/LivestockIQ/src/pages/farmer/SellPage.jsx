// frontend/src/pages/farmer/SellPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, CalendarIcon, ShieldCheck, ShoppingCart } from 'lucide-react'; // Added ShoppingCart icon
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getAnimals } from '../../services/animalService';
import { getTreatments } from '../../services/treatmentService';
import { addSale, getSales } from '../../services/salesService';

// Main Page Component
const SellPage = () => {
    const [animals, setAnimals] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [animalsData, treatmentsData, salesData] = await Promise.all([
                getAnimals(),
                getTreatments(),
                getSales()
            ]);
            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setTreatments(Array.isArray(treatmentsData) ? treatmentsData : []);
            setSales(Array.isArray(salesData) ? salesData : []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load page data." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const safeToSellAnimals = useMemo(() => {
        return animals.filter(animal => {
            const animalTreatments = treatments.filter(t => t.animalId === animal.tagId && t.status === 'Approved');
            if (animalTreatments.length === 0) return true;

            const lastTreatment = animalTreatments.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
            if (!lastTreatment.withdrawalEndDate) return false;

            return new Date() > new Date(lastTreatment.withdrawalEndDate);
        });
    }, [animals, treatments]);

    const handleSaveSale = async (saleData) => {
        try {
            await addSale(saleData);
            toast({ title: "Success", description: "Sale has been logged successfully." });
            fetchData();
            setIsFormOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Sale Failed", description: error.message || "Could not log the sale." });
        }
    };

    if (loading) return <div>Loading data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Log Sales</h1>
                    <p className="mt-1 text-gray-600">Record sales for animal products that have cleared their withdrawal periods.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Log New Sale</Button>
                    </DialogTrigger>
                    <SaleFormDialog
                        safeAnimals={safeToSellAnimals}
                        onSave={handleSaveSale}
                        onClose={() => setIsFormOpen(false)}
                    />
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-green-600" />
                        Animals Safe for Sale
                    </CardTitle>
                    <CardDescription>
                        This list shows animals whose products have cleared all treatment withdrawal periods. You can only log sales for these animals.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Animal ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Species</TableHead>
                                <TableHead>Last Cleared On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {safeToSellAnimals.length > 0 ? safeToSellAnimals.map(animal => {
                                const lastTreatment = treatments
                                    .filter(t => t.animalId === animal.tagId && t.status === 'Approved')
                                    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
                                
                                return (
                                    <TableRow key={animal._id}>
                                        <TableCell className="font-medium">{animal.tagId}</TableCell>
                                        <TableCell>{animal.name || 'N/A'}</TableCell>
                                        <TableCell>{animal.species}</TableCell>
                                        <TableCell>
                                            {lastTreatment?.withdrawalEndDate ? format(new Date(lastTreatment.withdrawalEndDate), 'PPP') : 'No treatments'}
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan="4" className="text-center h-24">No animals are currently safe for sale.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* --- NEW: SALES HISTORY TABLE --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" />
                        Sales History
                    </CardTitle>
                    <CardDescription>
                        A log of all your previously recorded sales.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Animal ID</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Sale Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.length > 0 ? sales.map(sale => (
                                <TableRow key={sale._id}>
                                    <TableCell>{format(new Date(sale.saleDate), 'PPP')}</TableCell>
                                    <TableCell className="font-medium">{sale.animalId}</TableCell>
                                    <TableCell>{sale.productType}</TableCell>
                                    <TableCell>{sale.quantity} {sale.unit}</TableCell>
                                    <TableCell>
                                        {sale.price.toLocaleString('en-IN', {
                                            style: 'currency',
                                            currency: 'INR',
                                        })}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan="5" className="text-center h-24">
                                        You have not logged any sales yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

// Form Dialog Component (unchanged)
const SaleFormDialog = ({ safeAnimals, onSave, onClose }) => {
    const [saleDate, setSaleDate] = useState(new Date());

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            animalId: formData.get('animalId'),
            productType: formData.get('productType'),
            quantity: parseFloat(formData.get('quantity')),
            unit: formData.get('unit'),
            price: parseFloat(formData.get('price')),
            saleDate: saleDate,
            notes: formData.get('notes'),
        };
        onSave(data);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Log a New Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="animalId">Animal</Label>
                    <Select name="animalId" required>
                        <SelectTrigger><SelectValue placeholder="Select a safe animal" /></SelectTrigger>
                        <SelectContent>
                            {safeAnimals.map(animal => (
                                <SelectItem key={animal.tagId} value={animal.tagId}>
                                    {animal.tagId} ({animal.name || animal.species})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="productType">Product</Label>
                        <Select name="productType" required>
                            <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Milk">Milk</SelectItem>
                                <SelectItem value="Meat">Meat</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="price">Total Price (₹)</Label>
                        <Input id="price" name="price" type="number" step="0.01" placeholder="e.g., 150.50" required />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input id="quantity" name="quantity" type="number" placeholder="e.g., 50" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Input id="unit" name="unit" placeholder="e.g., Liters, kg" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="saleDate">Date of Sale</Label>
                     <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(saleDate, 'PPP')}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={saleDate} onSelect={setSaleDate} /></PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea id="notes" name="notes" placeholder="e.g., Sold to local market" />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Log Sale</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default SellPage;