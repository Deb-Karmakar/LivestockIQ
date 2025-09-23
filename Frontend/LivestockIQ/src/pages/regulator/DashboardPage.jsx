// frontend/src/pages/regulator/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Users, Stethoscope, ClipboardCheck, MapPin, TrendingUp, BellRing, Expand, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Heatmap from '../../components/ui/Heatmap';
import { useToast } from '../../hooks/use-toast';
import { getDashboardStats } from '../../services/regulatorService'; // 1. IMPORT the new service

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
    
    // NEW: State for loading and live dashboard data
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    
    // NEW: Function to fetch live data from the backend
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
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!dashboardData) {
        return <div className="text-center p-8">Could not load dashboard data. Please try again later.</div>;
    }

    // All mock data has been removed. We now use 'dashboardData'.

    return (
        <div className="space-y-8 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.fullName || 'Regulator'}!</h1>
                <p className="mt-2 text-lg text-gray-600">Your central hub for monitoring regional compliance and antimicrobial usage.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registered Farms</CardTitle>
                        <Users className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.overviewStats.totalFarms}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registered Veterinarians</CardTitle>
                        <Stethoscope className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.overviewStats.totalVets}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Treatments Recorded</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.overviewStats.totalTreatments}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Antimicrobial Usage (AMU) Trends</CardTitle>
                        <CardDescription>Monthly recorded treatments over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
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

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Treatment Compliance Overview</CardTitle>
                        <CardDescription>Status of all submitted treatment records.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
            
            <div className="grid gap-6 lg:grid-cols-1">
                <Card className="shadow-sm">
                     <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center"><MapPin className="h-5 w-5 mr-2" /> AMU Intensity Heatmap</CardTitle>
                            <CardDescription>Visualization of high-concentration AMU hotspots.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsMapModalOpen(true)}>
                            <Expand className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
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
            </div>

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