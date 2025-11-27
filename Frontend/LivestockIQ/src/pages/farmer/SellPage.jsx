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
import { PlusCircle, CalendarIcon, ShieldCheck, ShoppingCart, Sparkles, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getAnimals } from '../../services/animalService';
import { getTreatments } from '../../services/treatmentService';
import { addSale, getSales } from '../../services/salesService';

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading sales data...</p>
            </div>
        );
    }

    // Calculate stats
    const stats = {
        totalSales: sales.length,
        safeAnimals: safeToSellAnimals.length,
        totalRevenue: sales.reduce((sum, sale) => sum + (sale.price || 0), 0),
        recentSales: sales.filter(s => {
            const saleDate = new Date(s.saleDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return saleDate >= thirtyDaysAgo;
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
                            <span>Sales Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Log Sales
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Record sales for animal products that have cleared withdrawal periods. You have{' '}
                            <span className="text-emerald-400 font-semibold">{stats.safeAnimals} animals</span> safe for sale with{' '}
                            <span className="text-blue-400 font-semibold">{stats.totalSales} total sales</span>.
                        </p>
                    </div>

                    <div className="w-full lg:w-auto">
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="lg"
                                    className="w-full lg:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Log New Sale
                                </Button>
                            </DialogTrigger>
                            <SaleFormDialog
                                safeAnimals={safeToSellAnimals}
                                onSave={handleSaveSale}
                                onClose={() => setIsFormOpen(false)}
                            />
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Total Sales"
                    value={stats.totalSales}
                    color="blue"
                    subtitle="All time"
                />
                <StatCard
                    title="Safe for Sale"
                    value={stats.safeAnimals}
                    color="green"
                    subtitle="Animals cleared"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    color="purple"
                    subtitle="All time earnings"
                />
                <StatCard
                    title="Recent Sales"
                    value={stats.recentSales}
                    color="orange"
                    subtitle="Last 30 days"
                />
            </div>

            {/* Safe Animals Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <CardTitle>Animals Safe for Sale</CardTitle>
                            <CardDescription>
                                Products from these animals have cleared all treatment withdrawal periods.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
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
                                    <TableCell colSpan="4" className="text-center h-24">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShieldCheck className="h-12 w-12 text-gray-400" />
                                            <p className="text-gray-600">No animals are currently safe for sale.</p>
                                            <p className="text-sm text-gray-500">Animals with active withdrawal periods will appear here once cleared.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Sales History Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle>Sales History</CardTitle>
                            <CardDescription>
                                A log of all your previously recorded sales.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
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
                                        <div className="flex flex-col items-center gap-2">
                                            <ShoppingCart className="h-12 w-12 text-gray-400" />
                                            <p className="text-gray-600">You have not logged any sales yet.</p>
                                            <p className="text-sm text-gray-500">Click "Log New Sale" to record your first sale.</p>
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

// Form Dialog Component
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