// frontend/src/pages/regulator/MapViewPageEnhanced.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Map as MapIcon, Loader2, AlertTriangle, Filter, Layers, Tractor, Stethoscope, AlertOctagon, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getMapData } from '../../services/regulatorService';
import pinIcon from '../../assets/pin.png';

// --- Custom Icons ---
const getIcon = (status) => {
    let color = '#3b82f6'; // Default Blue (Vet/Good)
    if (status === 'Critical') color = '#ef4444'; // Red
    else if (status === 'Warning') color = '#eab308'; // Yellow
    else if (status === 'Good') color = '#22c55e'; // Green

    const html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="30" height="30" stroke="white" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>`;

    return L.divIcon({
        html,
        className: 'custom-leaflet-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

const vetIcon = getIcon('Vet'); // Blue for vets

// --- Heatmap Component ---
const HeatmapLayer = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        let heatLayer = null;
        let retryTimer = null;

        const initHeatmap = () => {
            const size = map.getSize();
            if (size.x > 0 && size.y > 0) {
                heatLayer = L.heatLayer(points, {
                    radius: 30,
                    blur: 20,
                    maxZoom: 10,
                    gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
                }).addTo(map);
            } else {
                map.invalidateSize();
                retryTimer = setTimeout(initHeatmap, 200);
            }
        };

        initHeatmap();

        return () => {
            if (heatLayer) {
                map.removeLayer(heatLayer);
            }
            if (retryTimer) {
                clearTimeout(retryTimer);
            }
        };
    }, [map, points]);

    return null;
};

// --- GeoJSON Layer for India States ---
const IndiaStatesLayer = () => {
    const [geoJsonData, setGeoJsonData] = useState(null);

    useEffect(() => {
        fetch('/india-states.json')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error("Error loading India states GeoJSON:", err));
    }, []);

    if (!geoJsonData) return null;

    return (
        <GeoJSON
            data={geoJsonData}
            style={{
                fillColor: 'transparent',
                weight: 1,
                opacity: 1,
                color: '#3b82f6', // Blue border
                dashArray: '3',
                fillOpacity: 0
            }}
        />
    );
};

// --- Filter Panel Component ---
function FilterPanel({ filters, setFilters }) {
    return (
        <div className="space-y-4">
            <div>
                <Label className="font-semibold mb-2 block">View Mode</Label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <Button
                        size="sm"
                        variant={filters.viewMode === 'farms' ? 'default' : 'ghost'}
                        onClick={() => setFilters({ ...filters, viewMode: 'farms' })}
                        className="flex-1 gap-2"
                    >
                        <Tractor className="w-4 h-4" /> Farms
                    </Button>
                    <Button
                        size="sm"
                        variant={filters.viewMode === 'vets' ? 'default' : 'ghost'}
                        onClick={() => setFilters({ ...filters, viewMode: 'vets' })}
                        className="flex-1 gap-2"
                    >
                        <Stethoscope className="w-4 h-4" /> Vets
                    </Button>
                </div>
            </div>

            <div>
                <Label className="font-semibold mb-2 block">Search</Label>
                <Input
                    placeholder={filters.viewMode === 'farms' ? "Search farm name..." : "Search vet name..."}
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            </div>

            {filters.viewMode === 'farms' && (
                <div>
                    <Label className="font-semibold mb-2 block">Status Filter</Label>
                    <Select
                        value={filters.status}
                        onValueChange={value => setFilters({ ...filters, status: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Critical">Critical (Violations)</SelectItem>
                            <SelectItem value="Warning">Warning (High AMU)</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}

// --- Map Controls Component ---
function MapControls({ showHeatmap, setShowHeatmap, viewMode }) {
    if (viewMode !== 'farms') return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="heatmap-toggle" className="font-semibold">Show AMU Heatmap</Label>
                <Switch
                    id="heatmap-toggle"
                    checked={showHeatmap}
                    onCheckedChange={setShowHeatmap}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                Heatmap visualizes AMU intensity density across regions.
            </p>
        </div>
    );
}

// --- Legend Component ---
function Legend({ viewMode }) {
    if (viewMode === 'vets') {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <img src={pinIcon} alt="Vet" className="w-5 h-8" />
                    <span className="text-sm">Veterinarian Location</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm">Critical (MRL Violation)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-sm">Warning (High AMU)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm">Good</span>
            </div>
        </div>
    );
}

export default function MapViewPageEnhanced() {
    const [filters, setFilters] = useState({
        viewMode: 'farms', // 'farms' or 'vets'
        search: '',
        status: 'all'
    });
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [mapData, setMapData] = useState({ farms: [], vets: [] });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Fetch Data
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

    // Filter Logic
    const filteredData = useMemo(() => {
        if (filters.viewMode === 'farms') {
            return mapData.farms.filter(farm => {
                const matchesSearch = farm.farmName.toLowerCase().includes(filters.search.toLowerCase());
                const matchesStatus = filters.status === 'all' || farm.status === filters.status;
                return matchesSearch && matchesStatus;
            });
        } else {
            return mapData.vets.filter(vet => {
                const matchesSearch = vet.fullName.toLowerCase().includes(filters.search.toLowerCase());
                const hasLocation = vet.location && vet.location.latitude && vet.location.longitude;
                return matchesSearch && hasLocation;
            });
        }
    }, [mapData, filters]);

    // Heatmap Data
    const heatmapPoints = useMemo(() => {
        if (!showHeatmap || filters.viewMode !== 'farms') return [];
        return mapData.farms.map(farm => [
            farm.location.latitude,
            farm.location.longitude,
            Math.min(farm.amuIntensity * 10, 100) // Scale intensity
        ]);
    }, [mapData.farms, showHeatmap, filters.viewMode]);

    const mapCenter = [20.5937, 78.9629];
    const zoomLevel = 5;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading map data...</span>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Gradient Header */}
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
                            Visualize farm locations and antimicrobial usage trends.
                        </p>
                    </div>
                </div>
            </div>

            {/* Container with proper padding for mobile sidebar */}
            <div className="w-full max-w-full overflow-hidden">
                <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-0">

                    {/* Mobile Controls */}
                    <div className="lg:hidden flex items-center justify-between">
                        <h2 className="text-xl font-bold">Map Dashboard</h2>
                        <div className="flex gap-2">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                                    <SheetHeader>
                                        <SheetTitle>Filters</SheetTitle>
                                        <SheetDescription>
                                            Adjust map filters and search criteria.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                                        <FilterPanel
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Layers className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                                    <SheetHeader>
                                        <SheetTitle>Map Options</SheetTitle>
                                        <SheetDescription>
                                            Toggle heatmap and view legend.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                                        <div>
                                            <h3 className="font-semibold mb-3">Map View</h3>
                                            <MapControls
                                                showHeatmap={showHeatmap}
                                                setShowHeatmap={setShowHeatmap}
                                                viewMode={filters.viewMode}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-3">Legend</h3>
                                            <Legend viewMode={filters.viewMode} />
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-4 gap-6 h-[75vh]">
                        {/* Left Column: Filters & Legend */}
                        <div className="lg:col-span-1 space-y-6 flex flex-col overflow-y-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Filters</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FilterPanel
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Map View</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <MapControls
                                        showHeatmap={showHeatmap}
                                        setShowHeatmap={setShowHeatmap}
                                        viewMode={filters.viewMode}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Legend</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Legend viewMode={filters.viewMode} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Map */}
                        <div className="lg:col-span-3 h-full">
                            <Card className="h-full overflow-hidden">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={zoomLevel}
                                    scrollWheelZoom={true}
                                    style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />

                                    <IndiaStatesLayer />

                                    {showHeatmap ? (
                                        <HeatmapLayer points={heatmapPoints} />
                                    ) : (
                                        <MarkerClusterGroup
                                            chunkedLoading
                                            iconCreateFunction={(cluster) => {
                                                return L.divIcon({
                                                    html: `<div class="flex items-center justify-center w-full h-full bg-blue-600 text-white rounded-full font-bold border-2 border-white shadow-lg">${cluster.getChildCount()}</div>`,
                                                    className: 'custom-cluster-icon',
                                                    iconSize: [40, 40]
                                                });
                                            }}
                                        >
                                            {filteredData.map(item => (
                                                <Marker
                                                    key={item._id}
                                                    position={[item.location.latitude, item.location.longitude]}
                                                    icon={filters.viewMode === 'farms' ? getIcon(item.status) : vetIcon}
                                                >
                                                    <Popup className="custom-popup">
                                                        {filters.viewMode === 'farms' ? (
                                                            <div className="p-2 min-w-[200px]">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h3 className="font-bold text-lg">{item.farmName}</h3>
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'Critical' ? 'bg-red-100 text-red-800' :
                                                                        item.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-green-100 text-green-800'
                                                                        }`}>
                                                                        {item.status}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-1 text-sm text-gray-600">
                                                                    <p><span className="font-semibold">Owner:</span> {item.farmOwner}</p>
                                                                    <p><span className="font-semibold">Contact:</span> {item.phoneNumber || 'N/A'}</p>

                                                                    <div className="my-2 border-t pt-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <span>Herd Size:</span>
                                                                            <span className="font-bold">{item.herdSize || 'N/A'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center mt-1">
                                                                            <span>AMU Intensity:</span>
                                                                            <span className="font-bold">{item.amuIntensity}</span>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">
                                                                            <div className="flex justify-between">
                                                                                <span>Treatments:</span>
                                                                                <span>{item.amuBreakdown?.treatments || 0}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span>Medicated Feed:</span>
                                                                                <span>{item.amuBreakdown?.feed || 0}</span>
                                                                            </div>
                                                                        </div>

                                                                        {item.activeAlerts?.mrlViolations > 0 && (
                                                                            <div className="flex justify-between items-center text-red-600 mt-2 font-bold">
                                                                                <span className="flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> MRL Violations:</span>
                                                                                <span>{item.activeAlerts.mrlViolations}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-2">
                                                                <h3 className="font-bold text-lg">{item.fullName}</h3>
                                                                <p className="text-blue-600 text-sm font-medium">{item.specialization}</p>
                                                                <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                                    <p>License: {item.licenseNumber}</p>
                                                                    <p>Phone: {item.phoneNumber || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Popup>
                                                </Marker>
                                            ))}
                                        </MarkerClusterGroup>
                                    )}
                                </MapContainer>
                            </Card>
                        </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="lg:hidden -mx-4 sm:mx-0">
                        <Tabs defaultValue="map" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mx-4 sm:mx-0" style={{ width: 'calc(100% - 2rem)' }}>
                                <TabsTrigger value="map">Map</TabsTrigger>
                                <TabsTrigger value="info">Info</TabsTrigger>
                            </TabsList>

                            <TabsContent value="map" className="mt-4 px-4 sm:px-0">
                                <Card className="overflow-hidden">
                                    <div className="relative w-full" style={{ height: 'calc(100vh - 280px)', minHeight: '400px', maxHeight: '600px' }}>
                                        <MapContainer
                                            center={mapCenter}
                                            zoom={zoomLevel}
                                            scrollWheelZoom={true}
                                            style={{
                                                height: '100%',
                                                width: '100%',
                                                borderRadius: '0.5rem',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0
                                            }}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            />

                                            <IndiaStatesLayer />

                                            {showHeatmap ? (
                                                <HeatmapLayer points={heatmapPoints} />
                                            ) : (
                                                <MarkerClusterGroup
                                                    chunkedLoading
                                                    iconCreateFunction={(cluster) => {
                                                        return L.divIcon({
                                                            html: `<div class="flex items-center justify-center w-full h-full bg-blue-600 text-white rounded-full font-bold border-2 border-white shadow-lg">${cluster.getChildCount()}</div>`,
                                                            className: 'custom-cluster-icon',
                                                            iconSize: [40, 40]
                                                        });
                                                    }}
                                                >
                                                    {filteredData.map(item => (
                                                        <Marker
                                                            key={item._id}
                                                            position={[item.location.latitude, item.location.longitude]}
                                                            icon={filters.viewMode === 'farms' ? getIcon(item.status) : vetIcon}
                                                        >
                                                            <Popup className="custom-popup">
                                                                {filters.viewMode === 'farms' ? (
                                                                    <div className="p-2 min-w-[200px]">
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <h3 className="font-bold text-lg">{item.farmName}</h3>
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'Critical' ? 'bg-red-100 text-red-800' :
                                                                                item.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-green-100 text-green-800'
                                                                                }`}>
                                                                                {item.status}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-1 text-sm text-gray-600">
                                                                            <p><span className="font-semibold">Owner:</span> {item.farmOwner}</p>
                                                                            <p><span className="font-semibold">Contact:</span> {item.phoneNumber || 'N/A'}</p>

                                                                            <div className="my-2 border-t pt-2">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span>Herd Size:</span>
                                                                                    <span className="font-bold">{item.herdSize || 'N/A'}</span>
                                                                                </div>
                                                                                <div className="flex justify-between items-center mt-1">
                                                                                    <span>AMU Intensity:</span>
                                                                                    <span className="font-bold">{item.amuIntensity}</span>
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">
                                                                                    <div className="flex justify-between">
                                                                                        <span>Treatments:</span>
                                                                                        <span>{item.amuBreakdown?.treatments || 0}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span>Medicated Feed:</span>
                                                                                        <span>{item.amuBreakdown?.feed || 0}</span>
                                                                                    </div>
                                                                                </div>

                                                                                {item.activeAlerts?.mrlViolations > 0 && (
                                                                                    <div className="flex justify-between items-center text-red-600 mt-2 font-bold">
                                                                                        <span className="flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> MRL Violations:</span>
                                                                                        <span>{item.activeAlerts.mrlViolations}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-2">
                                                                        <h3 className="font-bold text-lg">{item.fullName}</h3>
                                                                        <p className="text-blue-600 text-sm font-medium">{item.specialization}</p>
                                                                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                                            <p>License: {item.licenseNumber}</p>
                                                                            <p>Phone: {item.phoneNumber || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Popup>
                                                        </Marker>
                                                    ))}
                                                </MarkerClusterGroup>
                                            )}
                                        </MapContainer>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="info" className="mt-4 space-y-4 px-4 sm:px-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Farms</p>
                                                <p className="text-2xl font-bold">{mapData.farms.length}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Vets</p>
                                                <p className="text-2xl font-bold">{mapData.vets.length}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Critical Farms</p>
                                                <p className="text-xl font-bold text-red-600">
                                                    {mapData.farms.filter(f => f.status === 'Critical').length}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Warning Farms</p>
                                                <p className="text-xl font-bold text-yellow-600">
                                                    {mapData.farms.filter(f => f.status === 'Warning').length}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Legend</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Legend viewMode={filters.viewMode} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
