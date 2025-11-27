// frontend/src/pages/regulator/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Users, Stethoscope, ClipboardCheck, MapPin, Expand, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Heatmap from '../../components/ui/Heatmap';
import { useToast } from '../../hooks/use-toast';
import { getDashboardStats } from '../../services/regulatorService';

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

// Helper component to fix map rendering issues inside a dialog
const InvalidateMapSize = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => { map.invalidateSize() }, 100);
    }, [map]);
    return null;
};

const DashboardPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getDashboardStats();
            setDashboardData(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load dashboard data." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const mapCenter = [20.5937, 78.9629];
    const zoomLevel = 5;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading dashboard...</p>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Could not load dashboard data. Please try again later.</p>
            </div>
        );
    }

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
                            <span>Regulatory Dashboard</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Welcome, {user?.fullName || 'Regulator'}!
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Your central hub for monitoring regional compliance and antimicrobial usage. Overseeing{' '}
                            <span className="text-blue-400 font-semibold">{dashboardData.overviewStats.totalFarms} farms</span> and{' '}
                            <span className="text-purple-400 font-semibold">{dashboardData.overviewStats.totalVets} veterinarians</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                <StatCard
                    title="Registered Farms"
                    value={dashboardData.overviewStats.totalFarms}
                    color="blue"
                    subtitle="Total farms monitored"
                />
                <StatCard
                    title="Veterinarians"
                    value={dashboardData.overviewStats.totalVets}
                    color="purple"
                    subtitle="Licensed practitioners"
                />
                <StatCard
                    title="Total Treatments"
                    value={dashboardData.overviewStats.totalTreatments}
                    color="green"
                    subtitle="Recorded interventions"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle className="text-xl">Antimicrobial Usage (AMU) Trends</CardTitle>
                        <CardDescription>Monthly recorded treatments over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dashboardData.amuTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="treatments" stroke="#8884d8" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle className="text-xl">Treatment Compliance Overview</CardTitle>
                        <CardDescription>Status of all submitted treatment records</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Approved Treatments:</span>
                                <span className="text-green-600 font-bold">{dashboardData.complianceStats.approved}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Pending Reviews:</span>
                                <span className="text-orange-600 font-bold">{dashboardData.complianceStats.pending}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Rejected Treatments:</span>
                                <span className="text-red-600 font-bold">{dashboardData.complianceStats.rejected}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Heatmap */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center"><MapPin className="h-5 w-5 mr-2" /> AMU Intensity Heatmap</CardTitle>
                        <CardDescription>Visualization of high-concentration AMU hotspots</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsMapModalOpen(true)}>
                        <Expand className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[300px] w-full rounded-lg overflow-hidden border">
                        <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Heatmap points={dashboardData.heatmapData} />
                        </MapContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Map Modal */}
            <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
                <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
                    <DialogHeader><CardTitle className="text-2xl">AMU Intensity Heatmap</CardTitle></DialogHeader>
                    <div className="flex-grow w-full rounded-lg overflow-hidden border">
                        <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Heatmap points={dashboardData.heatmapData} />
                            <InvalidateMapSize />
                        </MapContainer>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DashboardPage;