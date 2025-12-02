// frontend/src/pages/regulator/MapViewPageEnhanced.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Tractor, Stethoscope, Sparkles, AlertTriangle, CheckCircle, AlertOctagon, Map as MapIcon, Layers } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getMapData } from '../../services/regulatorService';

// --- Custom Icons ---
const createCustomIcon = (color, iconHtml) => {
    return L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        ">${iconHtml}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const icons = {
    Critical: createCustomIcon('#ef4444', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'), // Red Alert
    Warning: createCustomIcon('#f59e0b', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'), // Yellow Alert (same icon, different color)
    Good: createCustomIcon('#10b981', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'), // Green Check
    Vet: createCustomIcon('#3b82f6', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14v1a6 6 0 0 1-9.84 4.83L7 21"></path><path d="M11 10V7a4 4 0 0 1 8 0v3"></path><path d="M5 10v2a6 6 0 0 0 6 6"></path><path d="M4 19a2 2 0 1 0 4 0a2 2 0 1 0-4 0"></path></svg>') // Blue Stethoscope
};

// --- Heatmap Component ---
const HeatmapLayer = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const heat = L.heatLayer(points, {
            radius: 30,
            blur: 20,
            maxZoom: 10,
            gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, points]);

    return null;
};

const MapViewPageEnhanced = () => {
    const [view, setView] = useState('farms'); // 'farms' or 'vets'
    const [mapData, setMapData] = useState({ farms: [], vets: [] });
    const [loading, setLoading] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Critical', 'Warning', 'Good'
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMapData();
            setMapData(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load map data.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const mapCenter = [20.5937, 78.9629];
    const zoomLevel = 5;

    // Filter Logic
    const filteredFarms = useMemo(() => {
        return mapData.farms.filter(farm => {
            if (statusFilter !== 'all' && farm.status !== statusFilter) return false;
            return true;
        });
    }, [mapData.farms, statusFilter]);

    const vetsWithLocation = useMemo(() => {
        return mapData.vets.filter(vet => vet.location && vet.location.latitude && vet.location.longitude);
    }, [mapData.vets]);

    // Heatmap Data: [lat, lng, intensity]
    const heatmapPoints = useMemo(() => {
        if (!showHeatmap) return [];
        return mapData.farms.map(farm => [
            farm.location.latitude,
            farm.location.longitude,
            Math.min(farm.amuIntensity * 10, 100) // Scale intensity (assuming max ~10 treatments/month is high)
        ]);
    }, [mapData.farms, showHeatmap]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading map data...</p>
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
                            <span>Geospatial Intelligence</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            MRL & AMU Monitoring Map
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Visualize farm compliance, antimicrobial usage trends, and withdrawal alerts across the region.
                        </p>
                    </div>

                    {/* Stats Cards in Header */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="text-2xl font-bold">{mapData.farms.filter(f => f.status === 'Critical').length}</div>
                            <div className="text-xs text-red-300 flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3" /> Critical
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="text-2xl font-bold">{mapData.farms.filter(f => f.status === 'Warning').length}</div>
                            <div className="text-xs text-yellow-300 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Warning
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="text-2xl font-bold">{mapData.farms.filter(f => f.status === 'Good').length}</div>
                            <div className="text-xs text-emerald-300 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Compliant
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Controls & Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gray-50 border-b p-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-white rounded-lg border p-1 shadow-sm">
                                <Button
                                    size="sm"
                                    variant={view === 'farms' ? 'default' : 'ghost'}
                                    onClick={() => setView('farms')}
                                    className="gap-2"
                                >
                                    <Tractor className="w-4 h-4" /> Farms
                                </Button>
                                <Button
                                    size="sm"
                                    variant={view === 'vets' ? 'default' : 'ghost'}
                                    onClick={() => setView('vets')}
                                    className="gap-2"
                                >
                                    <Stethoscope className="w-4 h-4" /> Vets
                                </Button>
                            </div>

                            {view === 'farms' && (
                                <>
                                    <div className="h-8 w-px bg-gray-300 mx-2" />
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="heatmap-mode" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
                                            <Layers className="w-4 h-4" /> AMU Heatmap
                                        </Label>
                                        <Switch
                                            id="heatmap-mode"
                                            checked={showHeatmap}
                                            onCheckedChange={setShowHeatmap}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {view === 'farms' && (
                            <div className="flex items-center gap-2">
                                <Label className="text-sm text-gray-500">Filter Status:</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[180px] bg-white">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[1100]">
                                        <SelectItem value="all">All Farms</SelectItem>
                                        <SelectItem value="Critical">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500" /> Critical Alert
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Warning">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500" /> Warning
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Good">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Compliant
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="h-[700px] w-full relative rounded-b-xl overflow-hidden">
                        <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Heatmap Layer */}
                            {showHeatmap && <HeatmapLayer points={heatmapPoints} />}

                            {/* Farm Markers */}
                            {view === 'farms' && !showHeatmap && filteredFarms.map(farm => (
                                <Marker
                                    key={farm._id}
                                    position={[farm.location.latitude, farm.location.longitude]}
                                    icon={icons[farm.status] || icons.Good}
                                >
                                    <Popup className="custom-popup">
                                        <div className="p-2 min-w-[200px]">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg">{farm.farmName}</h3>
                                                <Badge variant={farm.status === 'Critical' ? 'destructive' : farm.status === 'Warning' ? 'warning' : 'default'} className={
                                                    farm.status === 'Warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                                        farm.status === 'Good' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                                                }>
                                                    {farm.status}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p><span className="font-semibold">Owner:</span> {farm.farmOwner}</p>
                                                <p><span className="font-semibold">Contact:</span> {farm.contactNumber || 'N/A'}</p>

                                                <div className="my-2 border-t pt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span>AMU Intensity:</span>
                                                        <span className="font-bold">{farm.amuIntensity}</span>
                                                    </div>
                                                    {farm.activeAlerts?.mrlViolations > 0 && (
                                                        <div className="flex justify-between items-center text-red-600">
                                                            <span>MRL Violations:</span>
                                                            <span className="font-bold">{farm.activeAlerts.mrlViolations}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center text-red-600">
                                                        <span>Active Alerts:</span>
                                                        <span className="font-bold">{farm.activeAlerts?.compliance || 0}</span>
                                                    </div>
                                                </div>

                                                {farm.latestIssue && (
                                                    <div className="bg-red-50 p-2 rounded text-xs text-red-700 mt-2 border border-red-100">
                                                        <strong>Issue:</strong> {farm.latestIssue}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Vet Markers */}
                            {view === 'vets' && vetsWithLocation.map(vet => (
                                <Marker
                                    key={vet._id}
                                    position={[vet.location.latitude, vet.location.longitude]}
                                    icon={icons.Vet}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <h3 className="font-bold text-lg">{vet.fullName}</h3>
                                            <p className="text-blue-600 text-sm font-medium">{vet.specialization}</p>
                                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                <p>License: {vet.licenseNumber}</p>
                                                <p>Phone: {vet.phoneNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Legend Overlay */}
                        {!showHeatmap && view === 'farms' && (
                            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border z-[1000] text-sm">
                                <h4 className="font-bold mb-2">Map Legend</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
                                        <span>Critical (Compliance Violation)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow-sm" />
                                        <span>Warning (High AMU)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" />
                                        <span>Good Standing</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showHeatmap && (
                            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border z-[1000] text-sm">
                                <h4 className="font-bold mb-2">AMU Intensity</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">Low</span>
                                    <div className="h-2 w-32 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full" />
                                    <span className="text-xs">High</span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MapViewPageEnhanced;
