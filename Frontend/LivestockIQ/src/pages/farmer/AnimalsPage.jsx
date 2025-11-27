// frontend/src/pages/farmer/AnimalsPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    PlusCircle, MoreHorizontal, QrCode, Trash2, FileText, Edit,
    BrainCircuit, Loader2, Search, Calendar, Weight, User2,
    Sparkles, RefreshCw, Users, Filter, Grid3X3, List,
    ChevronRight, Heart, Activity, TrendingUp, CheckCircle2,
    AlertTriangle, Clock, Eye, ArrowUpRight, Package
} from "lucide-react";
import BarcodeScannerDialog from "../../components/animals/BarcodeScannerDialog";
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';
import { getAnimals, addAnimal, updateAnimal, deleteAnimal } from '../../services/animalService';
import { getAnimalHealthTip } from '../../services/aiService';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';

// Animated counter component (matching Dashboard)
const AnimatedCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{count}</span>;
};

// Stat Card Component WITHOUT ICONS (matching Dashboard style)
const StatCard = ({ title, value, color, subtitle }) => {
    const colorClasses = {
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
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

const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const ageDifMs = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(ageDifMs);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();
    if (years > 0) return `${years}y ${months}m`;
    return `${months} months`;
};

// Species image and color mapping
const getSpeciesConfig = (species) => {
    const map = {
        'Cattle': { image: '/animals/cow.png', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
        'Buffalo': { image: '/animals/buffalo.png', color: 'from-slate-600 to-slate-800', bg: 'bg-slate-50' },
        'Sheep': { image: '/animals/sheep.png', color: 'from-gray-400 to-gray-600', bg: 'bg-gray-50' },
        'Goat': { image: '/animals/goat.png', color: 'from-stone-500 to-stone-700', bg: 'bg-stone-50' },
        'Pig': { image: '/animals/pig.png', color: 'from-pink-400 to-pink-600', bg: 'bg-pink-50' },
        'Horse': { image: '/animals/horse.png', color: 'from-amber-700 to-amber-900', bg: 'bg-amber-50' },
        'Yak': { image: '/animals/yak.png', color: 'from-zinc-600 to-zinc-800', bg: 'bg-zinc-50' },
        'Ox': { image: '/animals/ox.png', color: 'from-yellow-600 to-yellow-800', bg: 'bg-yellow-50' }
    };
    return map[species] || map['Cattle'];
};

// Status badge component with enhanced styling
const StatusBadge = ({ status }) => {
    const config = {
        'Active': {
            color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            icon: CheckCircle2,
            dot: 'bg-emerald-500'
        },
        'Sold': {
            color: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: Package,
            dot: 'bg-blue-500'
        },
        'Culled': {
            color: 'bg-orange-100 text-orange-700 border-orange-200',
            icon: AlertTriangle,
            dot: 'bg-orange-500'
        },
    };
    const finalConfig = config[status] || config['Active'];
    const Icon = finalConfig.icon;

    return (
        <Badge className={`border ${finalConfig.color} flex items-center gap-1.5 px-2.5 py-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${finalConfig.dot}`} />
            {status}
        </Badge>
    );
};

// Enhanced Animal Card Component
const AnimalCard = ({ animal, onEdit, onSetStatus, onDelete, onViewHistory, onViewTip }) => {
    const speciesConfig = getSpeciesConfig(animal.species);

    return (
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${speciesConfig.color}`} />

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-xl ${speciesConfig.bg} transition-transform group-hover:scale-110`}>
                            <img
                                src={speciesConfig.image}
                                alt={animal.species}
                                className="w-10 h-10 object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
                                {animal.tagId}
                            </CardTitle>
                            {animal.name && (
                                <CardDescription className="truncate font-medium">
                                    {animal.name}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                    <StatusBadge status={animal.status} />
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Animal Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                            <Heart className="h-3 w-3" />
                            Species
                        </div>
                        <div className="font-semibold text-sm text-gray-900">{animal.species}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                            <User2 className="h-3 w-3" />
                            Gender
                        </div>
                        <div className="font-semibold text-sm text-gray-900">{animal.gender || 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                            <Calendar className="h-3 w-3" />
                            Age
                        </div>
                        <div className="font-semibold text-sm text-gray-900">{calculateAge(animal.dob)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                            <Weight className="h-3 w-3" />
                            Weight
                        </div>
                        <div className="font-semibold text-sm text-gray-900">{animal.weight || 'N/A'}</div>
                    </div>
                </div>

                {/* Notes if present */}
                {animal.notes && (
                    <div className="text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                        <span className="font-semibold text-blue-700">Notes: </span>
                        <span className="text-gray-700">{animal.notes}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex gap-2 pt-4 border-t bg-gray-50/50">
                <Button
                    onClick={onEdit}
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
                >
                    <Edit className="h-4 w-4 mr-1.5" />
                    Edit
                </Button>
                <Button
                    onClick={onViewHistory}
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
                >
                    <FileText className="h-4 w-4 mr-1.5" />
                    History
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="px-2.5 hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={onViewTip}
                            className="text-blue-600 focus:bg-blue-50 focus:text-blue-700"
                        >
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            AI Health Tip
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onSetStatus("Sold")}
                            className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                        >
                            <Package className="mr-2 h-4 w-4" />
                            Mark as Sold
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onSetStatus("Culled")}
                            className="text-orange-600 focus:bg-orange-50 focus:text-orange-700"
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Mark as Culled
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-red-600 focus:bg-red-50 focus:text-red-700"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Record
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
    const [refreshing, setRefreshing] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const [viewingHistoryOf, setViewingHistoryOf] = useState(null);
    const [tipAnimal, setTipAnimal] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [speciesFilter, setSpeciesFilter] = useState("all");
    const [viewMode, setViewMode] = useState("grid");
    const { toast } = useToast();

    const fetchAnimals = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await getAnimals();
            setAnimals(data);

            if (isRefresh) {
                toast({ title: "Refreshed", description: "Animal data is up to date." });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || error.message || "Failed to load animal data."
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAnimals();
    }, [fetchAnimals]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = animals.length;
        const active = animals.filter(a => a.status === 'Active').length;
        const sold = animals.filter(a => a.status === 'Sold').length;
        const culled = animals.filter(a => a.status === 'Culled').length;

        // Get unique species
        const speciesList = [...new Set(animals.map(a => a.species))];

        return { total, active, sold, culled, speciesList };
    }, [animals]);

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

    // Filter animals based on search, status, and species
    const filteredAnimals = useMemo(() => {
        return animals.filter(animal => {
            const matchesSearch = searchTerm === "" ||
                animal.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (animal.name && animal.name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === "all" || animal.status === statusFilter;
            const matchesSpecies = speciesFilter === "all" || animal.species === speciesFilter;

            return matchesSearch && matchesStatus && matchesSpecies;
        });
    }, [animals, searchTerm, statusFilter, speciesFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading your animals...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Herd Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Animals & Livestock
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Manage your complete animal registry. You have{' '}
                            <span className="text-emerald-400 font-semibold">{stats.total} animals</span> registered across{' '}
                            <span className="text-blue-400 font-semibold">{stats.speciesList.length} species</span>.
                        </p>
                    </div>

                    <div className="w-full lg:w-auto">
                        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                            setIsFormOpen(isOpen);
                            if (!isOpen) setEditingAnimal(null);
                        }}>
                            <DialogTrigger asChild>
                                <Button
                                    size="lg"
                                    className="w-full lg:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
                                    onClick={() => setIsFormOpen(true)}
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Add Animal
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
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Total Animals"
                    value={stats.total}
                    color="blue"
                    subtitle="Registered in system"
                />
                <StatCard
                    title="Active"
                    value={stats.active}
                    color="green"
                    subtitle="Currently on farm"
                />
                <StatCard
                    title="Sold"
                    value={stats.sold}
                    color="purple"
                    subtitle="Transferred out"
                />
                <StatCard
                    title="Culled"
                    value={stats.culled}
                    color="orange"
                    subtitle="Removed from herd"
                />
            </div>

            {/* Filters and Search */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Filter className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Animal Registry</CardTitle>
                                <CardDescription>
                                    Showing {filteredAnimals.length} of {animals.length} animals
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Species Filter */}
                            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                                <SelectTrigger className="w-full sm:w-36">
                                    <SelectValue placeholder="Species..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Species</SelectItem>
                                    {stats.speciesList.map(species => (
                                        <SelectItem key={species} value={species}>{species}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-36">
                                    <SelectValue placeholder="Status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Sold">Sold</SelectItem>
                                    <SelectItem value="Culled">Culled</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by Tag ID or Name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* View Toggle */}
                            <div className="flex border rounded-lg overflow-hidden">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="rounded-none"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="rounded-none"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {filteredAnimals.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                            <AnimalListView
                                animals={filteredAnimals}
                                onEdit={handleEditClick}
                                onSetStatus={handleSetStatus}
                                onDelete={handleDeleteAnimal}
                                onViewHistory={setViewingHistoryOf}
                                onViewTip={handleViewTipClick}
                            />
                        )
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-xl font-semibold text-gray-700">No animals found</p>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                {searchTerm || statusFilter !== "all" || speciesFilter !== "all"
                                    ? "Try adjusting your search or filter criteria."
                                    : "Add your first animal to get started with herd management."}
                            </p>
                            {!searchTerm && statusFilter === "all" && speciesFilter === "all" && (
                                <Button
                                    className="mt-6"
                                    onClick={() => setIsFormOpen(true)}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Your First Animal
                                </Button>
                            )}
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

// List View Component
const AnimalListView = ({ animals, onEdit, onSetStatus, onDelete, onViewHistory, onViewTip }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b bg-gray-50">
                        <th className="text-left p-4 font-semibold text-gray-600">Animal</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Species</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Gender</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Age</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Weight</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                        <th className="text-right p-4 font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {animals.map((animal) => {
                        const speciesConfig = getSpeciesConfig(animal.species);
                        return (
                            <tr key={animal._id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${speciesConfig.bg}`}>
                                            <img
                                                src={speciesConfig.image}
                                                alt={animal.species}
                                                className="w-8 h-8 object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{animal.tagId}</p>
                                            {animal.name && (
                                                <p className="text-sm text-gray-500">{animal.name}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-700">{animal.species}</td>
                                <td className="p-4 text-gray-700">{animal.gender || 'N/A'}</td>
                                <td className="p-4 text-gray-700">{calculateAge(animal.dob)}</td>
                                <td className="p-4 text-gray-700">{animal.weight || 'N/A'}</td>
                                <td className="p-4">
                                    <StatusBadge status={animal.status} />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(animal)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewHistory(animal.tagId)}
                                        >
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onViewTip(animal)}>
                                                    <BrainCircuit className="mr-2 h-4 w-4" />
                                                    AI Health Tip
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onSetStatus(animal._id, "Sold")}>
                                                    Mark as Sold
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onSetStatus(animal._id, "Culled")}>
                                                    Mark as Culled
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(animal._id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                            {animal ? <Edit className="w-5 h-5 text-emerald-600" /> : <PlusCircle className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <div>
                            <DialogTitle>{animal ? "Edit Animal Profile" : "Add New Animal"}</DialogTitle>
                            <DialogDescription>
                                {animal ? "Update the details for this animal." : "Enter the details for the new animal below."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="tagId" className="text-sm font-medium">Official 12-Digit Tag ID</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tagId"
                                    name="tagId"
                                    value={formData.tagId}
                                    onChange={handleChange}
                                    required
                                    disabled={!!animal}
                                    placeholder="e.g., 342987123456"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsScannerOpen(true)}
                                    disabled={!!animal}
                                    className="shrink-0"
                                >
                                    <QrCode className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">Animal Name (Optional)</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Gauri"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="species" className="text-sm font-medium">Species</Label>
                                <Select
                                    name="species"
                                    value={formData.species}
                                    onValueChange={(v) => handleSelectChange("species", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select species" />
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
                                <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob" className="text-sm font-medium">Date of Birth</Label>
                            <Input
                                id="dob"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="weight" className="text-sm font-medium">Weight</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="weight"
                                    name="weight"
                                    type="number"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="Enter weight"
                                    className="flex-1"
                                />
                                <Select
                                    name="weightUnit"
                                    value={formData.weightUnit}
                                    onValueChange={(v) => handleSelectChange("weightUnit", v)}
                                >
                                    <SelectTrigger className="w-20">
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
                            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any specific details about this animal..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                            {animal ? "Save Changes" : "Add Animal"}
                        </Button>
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <BrainCircuit className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle>AI Health Tip</DialogTitle>
                            <DialogDescription>
                                For {animal?.name || animal?.tagId}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-32 gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-gray-200 rounded-full" />
                                <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                            </div>
                            <p className="text-sm text-gray-500">Analyzing health data...</p>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                <p className="text-gray-700 leading-relaxed">{tip}</p>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Got it, thanks!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AnimalsPage;