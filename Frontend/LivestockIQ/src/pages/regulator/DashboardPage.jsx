import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"; // NEW: Import Dialog components
import { Users, Stethoscope, ClipboardCheck, MapPin, TrendingUp, BellRing, Expand } from 'lucide-react'; // NEW: Import Expand icon
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Heatmap from '../../components/ui/Heatmap';

// --- Mock Data ---
const mockAmuTrendData = [
    { name: 'Jan', treatments: 400 }, { name: 'Feb', treatments: 300 }, { name: 'Mar', treatments: 500 },
    { name: 'Apr', treatments: 450 }, { name: 'May', treatments: 600 }, { name: 'Jun', treatments: 550 },
];
const mockComplianceStats = { approved: 1250, pending: 80, rejected: 15 };
const mockOverviewStats = { totalFarms: 150, totalVets: 35, totalTreatments: 1345 };
const mockHeatmapData = [
    ...Array.from({ length: 40 }, () => [30.73 + (Math.random() - 0.5) * 2, 76.77 + (Math.random() - 0.5) * 2, Math.random() * 100]),
    ...Array.from({ length: 30 }, () => [26.84 + (Math.random() - 0.5) * 3, 80.94 + (Math.random() - 0.5) * 3, Math.random() * 100]),
    ...Array.from({ length: 25 }, () => [19.07 + (Math.random() - 0.5) * 2, 72.87 + (Math.random() - 0.5) * 2, Math.random() * 80]),
    ...Array.from({ length: 50 }, () => [20.59 + (Math.random() - 0.5) * 20, 78.96 + (Math.random() - 0.5) * 20, Math.random() * 50]),
];

// NEW: Helper component to fix map rendering issues inside a dialog
const InvalidateMapSize = () => {
    const map = useMap();
    useEffect(() => {
        // This ensures the map resizes correctly when the dialog opens
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map]);
    return null;
};

const DashboardPage = () => {
    const { user } = useAuth();
    const [isMapModalOpen, setIsMapModalOpen] = useState(false); // NEW: State to control the map modal
    const mapCenter = [20.5937, 78.9629];
    const zoomLevel = 5;

    return (
        <div className="space-y-8 p-4 md:p-6 lg:p-8">
            {/* Header and Key Metrics Sections (Unchanged) */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.fullName || 'Regulator'}!</h1>
                <p className="mt-2 text-lg text-gray-600">Your central hub for monitoring regional compliance and antimicrobial usage.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Registered Farms</CardTitle><Users className="h-4 w-4 text-gray-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockOverviewStats.totalFarms}</div><p className="text-xs text-gray-500">+10% since last month</p></CardContent></Card>
                <Card className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Registered Veterinarians</CardTitle><Stethoscope className="h-4 w-4 text-gray-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockOverviewStats.totalVets}</div><p className="text-xs text-gray-500">+2 new this quarter</p></CardContent></Card>
                <Card className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Treatments Recorded</CardTitle><ClipboardCheck className="h-4 w-4 text-gray-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockOverviewStats.totalTreatments}</div><p className="text-xs text-gray-500">+50 in the last 7 days</p></CardContent></Card>
            </div>

            {/* Charts, Compliance, and Alerts Sections (Unchanged) */}
            <div className="grid gap-6 lg:grid-cols-2">
                 <Card className="shadow-sm"><CardHeader><CardTitle className="text-xl">Antimicrobial Usage (AMU) Trends</CardTitle><CardDescription>Monthly recorded treatments over the last 6 months.</CardDescription></CardHeader><CardContent><div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={mockAmuTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="treatments" stroke="#8884d8" activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer></div></CardContent></Card>
                 <Card className="shadow-sm"><CardHeader><CardTitle className="text-xl">Treatment Compliance Overview</CardTitle><CardDescription>Status of all submitted treatment records.</CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center justify-between"><span className="font-medium">Approved Treatments:</span><span className="text-green-600 font-bold">{mockComplianceStats.approved}</span></div><div className="flex items-center justify-between"><span className="font-medium">Pending Reviews:</span><span className="text-orange-600 font-bold">{mockComplianceStats.pending}</span></div><div className="flex items-center justify-between"><span className="font-medium">Rejected Treatments:</span><span className="text-red-600 font-bold">{mockComplianceStats.rejected}</span></div></div></CardContent></Card>
                 <Card className="shadow-sm"><CardHeader><CardTitle className="text-xl">Recent Non-Compliance Alerts</CardTitle><CardDescription>Immediate attention required for flagged activities.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex items-center"><BellRing className="h-5 w-5 text-red-500 mr-3" /><span>**Farm A**: High AMU detected last week. <a href="#" className="text-blue-600 hover:underline">View Details</a></span></div><div className="flex items-center"><BellRing className="h-5 w-5 text-orange-500 mr-3" /><span>**Vet B**: Missing report for Q1 2023. <a href="#" className="text-blue-600 hover:underline">View Details</a></span></div></CardContent></Card>

                {/* UPDATED: Heatmap Card now has an Expand button */}
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
                        <div className="h-[250px] w-full rounded-lg overflow-hidden border">
                            <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Heatmap points={mockHeatmapData} />
                            </MapContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* NEW: Render the enlarged map dialog */}
            <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
                <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
                    <DialogHeader>
                        <CardTitle className="text-2xl">AMU Intensity Heatmap</CardTitle>
                    </DialogHeader>
                    <div className="flex-grow w-full rounded-lg overflow-hidden border">
                         <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Heatmap points={mockHeatmapData} />
                            <InvalidateMapSize />
                        </MapContainer>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DashboardPage;