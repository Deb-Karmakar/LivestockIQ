// frontend/src/pages/farmer/InventoryPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreHorizontal, CalendarIcon, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../services/inventoryService';

const ExpiryBadge = ({ expiryDate }) => {
    const daysLeft = differenceInDays(new Date(expiryDate), new Date());
    let config = {
        text: `${daysLeft} days left`,
        color: 'text-gray-600',
    };

    if (daysLeft < 0) {
        config = { text: 'Expired', color: 'text-red-600 font-semibold' };
    } else if (daysLeft <= 30) {
        config = { text: `${daysLeft} days left`, color: 'text-amber-600' };
    }

    return <span className={config.color}>{config.text}</span>;
};


const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const { toast } = useToast();

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getInventory();
            setInventory(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load inventory." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleSaveItem = async (itemData) => {
        try {
            if (editingItem) {
                await updateInventoryItem(editingItem._id, itemData);
                toast({ title: "Success", description: "Inventory item updated." });
            } else {
                await addInventoryItem(itemData);
                toast({ title: "Success", description: "New item added to inventory." });
            }
            fetchInventory();
            setIsFormOpen(false);
            setEditingItem(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to save item." });
        }
    };
    
    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteInventoryItem(itemId);
                toast({ title: "Success", description: "Inventory item deleted." });
                fetchInventory();
            } catch (error) {
                 toast({ variant: "destructive", title: "Error", description: "Failed to delete item." });
            }
        }
    };
    
    const openForm = (item = null) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    if (loading) return <div>Loading inventory...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Drug Inventory</h1>
                    <p className="mt-1 text-gray-600">Manage your stock of veterinary medicines.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) setEditingItem(null); setIsFormOpen(isOpen); }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
                    </DialogTrigger>
                    {isFormOpen && (
                        <InventoryFormDialog 
                            onSave={handleSaveItem}
                            item={editingItem}
                            onClose={() => setIsFormOpen(false)}
                        />
                    )}
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Current Stock</CardTitle>
                    <CardDescription>Items are sorted by the soonest expiry date.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Drug Name</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventory.length > 0 ? inventory.map(item => (
                                <TableRow key={item._id}>
                                    <TableCell className="font-medium">{item.drugName}</TableCell>
                                    <TableCell>{item.quantity} {item.unit}</TableCell>
                                    <TableCell>{format(new Date(item.expiryDate), 'PPP')}</TableCell>
                                    <TableCell><ExpiryBadge expiryDate={item.expiryDate} /></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => openForm(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteItem(item._id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan="5" className="text-center h-24">Your inventory is empty.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

const InventoryFormDialog = ({ item, onSave, onClose }) => {
    const [expiryDate, setExpiryDate] = useState(item?.expiryDate ? new Date(item.expiryDate) : null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            drugName: formData.get('drugName'),
            quantity: Number(formData.get('quantity')),
            unit: formData.get('unit'),
            expiryDate,
            supplier: formData.get('supplier'),
            notes: formData.get('notes'),
        };
        onSave(data);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{item ? 'Edit Inventory Item' : 'Add New Item to Inventory'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="drugName">Drug Name</Label>
                    <Input id="drugName" name="drugName" defaultValue={item?.drugName} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input id="quantity" name="quantity" type="number" defaultValue={item?.quantity} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Input id="unit" name="unit" placeholder="e.g., bottles, ml" defaultValue={item?.unit} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {expiryDate ? format(expiryDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier (Optional)</Label>
                    <Input id="supplier" name="supplier" defaultValue={item?.supplier} />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Item</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default InventoryPage;