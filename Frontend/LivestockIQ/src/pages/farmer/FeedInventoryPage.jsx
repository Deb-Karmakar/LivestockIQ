import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreHorizontal, CalendarIcon, Trash2, Edit, AlertTriangle, Sparkles, Package } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getFeedInventory, addFeedItem, updateFeedItem, deleteFeedItem, getFeedStats } from '../../services/feedService';

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

const FeedInventoryPage = () => {
    const [feedInventory, setFeedInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [stats, setStats] = useState(null);
    const { toast } = useToast();

    const fetchFeedInventory = useCallback(async () => {
        try {
            setLoading(true);
            const [data, statsData] = await Promise.all([
                getFeedInventory(),
                getFeedStats()
            ]);
            setFeedInventory(data || []);
            setStats(statsData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load feed inventory." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchFeedInventory();
    }, [fetchFeedInventory]);

    const handleSaveItem = async (itemData) => {
        try {
            if (editingItem) {
                await updateFeedItem(editingItem._id, itemData);
                toast({ title: "Success", description: "Feed item updated." });
            } else {
                await addFeedItem(itemData);
                toast({ title: "Success", description: "New feed added to inventory." });
            }
            fetchFeedInventory();
            setIsFormOpen(false);
            setEditingItem(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to save feed." });
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this feed item?')) {
            try {
                await deleteFeedItem(itemId);
                toast({ title: "Success", description: "Feed item deleted." });
                fetchFeedInventory();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to delete feed." });
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
                <p className="text-gray-500 font-medium">Loading feed inventory...</p>
            </div>
        );
    }

    // Calculate stats
    const calculatedStats = {
        totalItems: feedInventory.length,
        activeFeed: feedInventory.filter(item => item.remainingQuantity > 0 && !item.isExpired).length,
        expiringSoon: feedInventory.filter(item => {
            const daysLeft = differenceInDays(new Date(item.expiryDate), new Date());
            return daysLeft >= 0 && daysLeft <= 30;
        }).length,
        expired: feedInventory.filter(item => {
            const daysLeft = differenceInDays(new Date(item.expiryDate), new Date());
            return daysLeft < 0;
        }).length,
        lowStock: feedInventory.filter(item => item.isLowStock).length
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
                            <span>Feed Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Medicated Feed Inventory
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Manage your stock of medicated feed. You have{' '}
                            <span className="text-blue-400 font-semibold">{calculatedStats.totalItems} items</span> in inventory with{' '}
                            <span className="text-amber-400 font-semibold">{calculatedStats.expiringSoon} expiring soon</span>.
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
                                    Add Medicated Feed
                                </Button>
                            </DialogTrigger>
                            {isFormOpen && (
                                <FeedFormDialog
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
                <StatCard
                    title="Total Items"
                    value={calculatedStats.totalItems}
                    color="blue"
                    subtitle="In inventory"
                />
                <StatCard
                    title="Active Feed"
                    value={calculatedStats.activeFeed}
                    color="green"
                    subtitle="Available"
                />
                <StatCard
                    title="Low Stock"
                    value={calculatedStats.lowStock}
                    color="purple"
                    subtitle="Need restocking"
                />
                <StatCard
                    title="Expiring Soon"
                    value={calculatedStats.expiringSoon}
                    color="orange"
                    subtitle="Within 30 days"
                />
                <StatCard
                    title="Expired"
                    value={calculatedStats.expired}
                    color="red"
                    subtitle="Needs disposal"
                />
            </div>

            {/* Feed Inventory Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle>Current Stock</CardTitle>
                            <CardDescription>Medicated feed sorted by expiry date.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Feed Name</TableHead>
                                    <TableHead>Antimicrobial</TableHead>
                                    <TableHead>Concentration</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Remaining</TableHead>
                                    <TableHead>Expiry Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedInventory.length > 0 ? feedInventory.map(item => (
                                    <TableRow key={item._id}>
                                        <TableCell className="font-medium">{item.feedName}</TableCell>
                                        <TableCell>{item.antimicrobialName}</TableCell>
                                        <TableCell>{item.antimicrobialConcentration} mg/kg</TableCell>
                                        <TableCell>{item.totalQuantity} {item.unit}</TableCell>
                                        <TableCell>
                                            <span className={item.isLowStock ? 'text-amber-600 font-semibold' : ''}>
                                                {item.remainingQuantity} {item.unit}
                                            </span>
                                        </TableCell>
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
                                        <TableCell colSpan="8" className="text-center h-24">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-12 w-12 text-gray-400" />
                                                <p className="text-gray-600">Your feed inventory is empty.</p>
                                                <p className="text-sm text-gray-500">Click "Add Medicated Feed" to start tracking.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const FeedFormDialog = ({ item, onSave, onClose }) => {
    const [expiryDate, setExpiryDate] = useState(item?.expiryDate ? new Date(item.expiryDate) : null);
    const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate ? new Date(item.purchaseDate) : new Date());
    const [targetSpecies, setTargetSpecies] = useState(item?.targetSpecies || []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            feedName: formData.get('feedName'),
            feedType: formData.get('feedType'),
            antimicrobialName: formData.get('antimicrobialName'),
            antimicrobialConcentration: Number(formData.get('antimicrobialConcentration')),
            totalQuantity: Number(formData.get('totalQuantity')),
            remainingQuantity: item ? Number(formData.get('remainingQuantity')) : Number(formData.get('totalQuantity')),
            unit: formData.get('unit'),
            batchNumber: formData.get('batchNumber'),
            manufacturer: formData.get('manufacturer'),
            purchaseDate,
            expiryDate,
            withdrawalPeriodDays: Number(formData.get('withdrawalPeriodDays')),
            targetSpecies: targetSpecies,
            prescriptionRequired: formData.get('prescriptionRequired') === 'true',
            notes: formData.get('notes')
        };
        onSave(data);
    };

    const handleSpeciesChange = (e) => {
        const value = e.target.value;
        if (e.target.checked) {
            setTargetSpecies([...targetSpecies, value]);
        } else {
            setTargetSpecies(targetSpecies.filter(s => s !== value));
        }
    };

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{item ? 'Edit Feed Item' : 'Add New Medicated Feed'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="feedName">Feed Name *</Label>
                        <Input id="feedName" name="feedName" placeholder="e.g., Starter Feed" defaultValue={item?.feedName} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="feedType">Feed Type *</Label>
                        <Select name="feedType" defaultValue={item?.feedType || ''} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Starter">Starter</SelectItem>
                                <SelectItem value="Grower">Grower</SelectItem>
                                <SelectItem value="Finisher">Finisher</SelectItem>
                                <SelectItem value="Layer">Layer</SelectItem>
                                <SelectItem value="Breeder">Breeder</SelectItem>
                                <SelectItem value="Concentrate">Concentrate</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="antimicrobialName">Antimicrobial Name *</Label>
                        <Input id="antimicrobialName" name="antimicrobialName" placeholder="e.g., Oxytetracycline" defaultValue={item?.antimicrobialName} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="antimicrobialConcentration">Concentration (mg/kg) *</Label>
                        <Input id="antimicrobialConcentration" name="antimicrobialConcentration" type="number" placeholder="500" defaultValue={item?.antimicrobialConcentration} required />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="totalQuantity">Total Quantity *</Label>
                        <Input id="totalQuantity" name="totalQuantity" type="number" defaultValue={item?.totalQuantity} required />
                    </div>
                    {item && (
                        <div className="space-y-2">
                            <Label htmlFor="remainingQuantity">Remaining *</Label>
                            <Input id="remainingQuantity" name="remainingQuantity" type="number" defaultValue={item?.remainingQuantity} required />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="unit">Unit *</Label>
                        <Select name="unit" defaultValue={item?.unit || ''} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                <SelectItem value="bags">Bags</SelectItem>
                                <SelectItem value="tons">Tons</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="batchNumber">Batch Number</Label>
                        <Input id="batchNumber" name="batchNumber" placeholder="BATCH-2024-001" defaultValue={item?.batchNumber} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input id="manufacturer" name="manufacturer" placeholder="FeedCo Ltd" defaultValue={item?.manufacturer} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Purchase Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {purchaseDate ? format(purchaseDate, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={purchaseDate} onSelect={setPurchaseDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Expiry Date *</Label>
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
                </div>

                <div className="space-y-2">
                    <Label htmlFor="withdrawalPeriodDays">Withdrawal Period (Days) *</Label>
                    <Input id="withdrawalPeriodDays" name="withdrawalPeriodDays" type="number" placeholder="7" defaultValue={item?.withdrawalPeriodDays} required />
                </div>

                <div className="space-y-2">
                    <Label>Target Species *</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {['Poultry', 'Cattle', 'Goat', 'Sheep', 'Pig', 'Other'].map(species => (
                            <label key={species} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value={species}
                                    checked={targetSpecies.includes(species)}
                                    onChange={handleSpeciesChange}
                                    className="rounded"
                                />
                                <span className="text-sm">{species}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="prescriptionRequired">Prescription Required *</Label>
                    <Select name="prescriptionRequired" defaultValue={item?.prescriptionRequired ? 'true' : 'false'} required>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input id="notes" name="notes" placeholder="Additional information" defaultValue={item?.notes} />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Feed</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default FeedInventoryPage;
