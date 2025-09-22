import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
// CORRECTED: Replaced the non-existent 'PackageWarning' icon with 'ShieldAlert'
import { PlusCircle, MoreHorizontal, CalendarIcon, ShieldAlert, PackageCheck, Package } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

// --- Mock Data ---
const initialInventory = [
    { id: 'DRG-001', name: 'Enrofloxacin', batch: 'ENR-A123', quantity: 25, unit: 'ml', expiry: new Date('2026-08-31') },
    { id: 'DRG-002', name: 'Amoxicillin', batch: 'AMX-B456', quantity: 5, unit: 'bottles', expiry: new Date('2025-11-30') },
    { id: 'DRG-003', name: 'Ivermectin', batch: 'IVM-C789', quantity: 12, unit: 'ml', expiry: new Date('2025-09-25') },
    { id: 'DRG-004', name: 'Tylosin', batch: 'TYL-D101', quantity: 0, unit: 'grams', expiry: new Date('2024-12-31') },
];

// --- Helper Function for Stock Status ---
const getStockStatus = (item) => {
    const daysUntilExpiry = differenceInDays(item.expiry, new Date());

    if (isPast(item.expiry)) {
        return { text: 'Expired', variant: 'destructive', icon: <ShieldAlert className="h-3 w-3" /> };
    }
    if (daysUntilExpiry <= 30) {
        return { text: 'Expiring Soon', variant: 'warning', icon: <ShieldAlert className="h-3 w-3" /> };
    }
    if (item.quantity === 0) {
        return { text: 'Out of Stock', variant: 'destructive', icon: <ShieldAlert className="h-3 w-3" /> };
    }
    if (item.quantity <= 5) {
        return { text: 'Low Stock', variant: 'warning', icon: <ShieldAlert className="h-3 w-3" /> };
    }
    return { text: 'In Stock', variant: 'secondary', icon: <PackageCheck className="h-3 w-3" /> };
};


// --- Main Inventory Page Component ---
const InventoryPage = () => {
    const [inventory, setInventory] = useState(initialInventory);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleSaveStock = (newStockItem) => {
        setInventory(prev => [...prev, { ...newStockItem, id: `DRG-00${prev.length + 1}` }]);
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Drug Inventory</h1>
                    <p className="mt-1 text-gray-600">Manage your stock of antimicrobial drugs and track expiry dates.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button className="mt-4 md:mt-0">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Stock Entry
                        </Button>
                    </DialogTrigger>
                    <AddStockFormDialog onSave={handleSaveStock} onClose={() => setIsFormOpen(false)} />
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Stock</CardTitle>
                    <CardDescription>A list of all drugs currently in your inventory.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Drug Name</TableHead>
                                <TableHead>Batch Number</TableHead>
                                <TableHead>Quantity in Stock</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventory.map(item => {
                                const status = getStockStatus(item);
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.batch}</TableCell>
                                        <TableCell>{item.quantity} {item.unit}</TableCell>
                                        <TableCell>{format(item.expiry, 'MMM d, yyyy')}</TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant} className="flex items-center gap-1.5 w-fit">
                                                {status.icon}{status.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Actions like Edit, View History can be added here */}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Add Stock Form Dialog ---
const AddStockFormDialog = ({ onSave, onClose }) => {
    const [expiry, setExpiry] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            batch: formData.get('batch'),
            quantity: parseFloat(formData.get('quantity')),
            unit: formData.get('unit'),
            expiry: expiry,
        };
        // Basic validation
        if (!data.name || !data.batch || !data.quantity || !data.unit || !data.expiry) {
            alert("Please fill out all fields.");
            return;
        }
        onSave(data);
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Add New Stock Entry</DialogTitle>
                <DialogDescription>Enter the details of the new drug stock below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Drug Name</Label>
                        <Input id="name" name="name" placeholder="e.g., Enrofloxacin" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="batch">Batch Number</Label>
                        <Input id="batch" name="batch" placeholder="e.g., ENR-A123" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" name="quantity" type="number" placeholder="e.g., 25" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input id="unit" name="unit" placeholder="e.g., ml" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiry ? format(expiry, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={expiry} onSelect={setExpiry} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Add to Inventory</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default InventoryPage;

