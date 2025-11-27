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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreHorizontal, CalendarIcon, Trash2, Edit, AlertTriangle, Sparkles, Package, Pill } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../services/inventoryService';

// Animated Counter Component
const AnimatedCounter = ({ value }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (typeof value !== 'number') {
            setCount(value);
            return;
        }
        let start = 0;
        const end = value;
        const duration = 1000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{count}</span>;
};

// Stat Card Component
const StatCard = ({ title, value, color, subtitle }) => {
    const colorClasses = {
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/25',
        red: 'from-red-500 to-red-600 shadow-red-500/25',
    };

    return (
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-[0.03]`} />
            <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                            <AnimatedCounter value={value} />
                        </span>
                    </div>
                    {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
};

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading inventory...</p>
            </div>
        );
    }

    // Calculate stats
    const stats = {
        totalItems: inventory.length,
        expiringSoon: inventory.filter(item => {
            const daysLeft = differenceInDays(new Date(item.expiryDate), new Date());
            return daysLeft >= 0 && daysLeft <= 30;
        }).length,
        expired: inventory.filter(item => {
            const daysLeft = differenceInDays(new Date(item.expiryDate), new Date());
            return daysLeft < 0;
        }).length,
        healthy: inventory.filter(item => {
            const daysLeft = differenceInDays(new Date(item.expiryDate), new Date());
            return daysLeft > 30;
        }).length
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Inventory Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Drug Inventory
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Manage your stock of veterinary medicines. You have{' '}
                            <span className="text-blue-400 font-semibold">{stats.totalItems} items</span> in inventory with{' '}
                            <span className="text-amber-400 font-semibold">{stats.expiringSoon} expiring soon</span>.
                        </p>
                    </div>

                    <div className="w-full lg:w-auto">
                        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingItem(null); setIsFormOpen(isOpen); }}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => openForm()}
                                    size="lg"
                                    className="w-full lg:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Add Item
                                </Button>
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
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Total Items"
                    value={stats.totalItems}
                    color="blue"
                    subtitle="In inventory"
                />
                <StatCard
                    title="Healthy Stock"
                    value={stats.healthy}
                    color="green"
                    subtitle="Good condition"
                />
                <StatCard
                    title="Expiring Soon"
                    value={stats.expiringSoon}
                    color="orange"
                    subtitle="Within 30 days"
                />
                <StatCard
                    title="Expired"
                    value={stats.expired}
                    color="red"
                    subtitle="Needs disposal"
                />
            </div>

            {/* Inventory Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                            <Pill className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle>Current Stock</CardTitle>
                            <CardDescription>Items are sorted by the soonest expiry date.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
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
                                    <TableCell colSpan="5" className="text-center h-24">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="h-12 w-12 text-gray-400" />
                                            <p className="text-gray-600">Your inventory is empty.</p>
                                            <p className="text-sm text-gray-500">Click "Add Item" to start tracking your drug inventory.</p>
                                        </div>
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