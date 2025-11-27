// frontend/src/pages/regulator/MapViewPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Tractor, Stethoscope, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getMapData } from '../../services/regulatorService';
import customPinIcon from '../../assets/generated_images/pin.png';

const farmIcon = new L.Icon({
    iconUrl: customPinIcon,
    iconSize: [20, 20],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const vetIcon = new L.Icon({
    iconUrl: customPinIcon,
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25]
});

const MapViewPage = () => {
    const [view, setView] = useState('farms');
    const [mapData, setMapData] = useState({ farms: [], vets: [] });
    const [loading, setLoading] = useState(true);
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

    const vetsWithLocation = mapData.vets.filter(vet =>
        vet.location &&
        vet.location.latitude &&
        vet.location.longitude
    );

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
                            <span>Geospatial Analysis</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Geospatial Analysis
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Visualize farm and vet locations on an interactive map. Currently showing{' '}
                            <span className="text-blue-400 font-semibold">{view === 'farms' ? mapData.farms.length : vetsWithLocation.length} locations</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Map Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Regional Map</CardTitle>
                            <CardDescription>
                                Showing {view === 'farms'
                                    ? `${mapData.farms.length} Farm`
                                    : `${vetsWithLocation.length} Veterinarian`} locations
                            </CardDescription>
                        </div>
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            <Button size="sm" variant={view === 'farms' ? 'default' : 'ghost'} onClick={() => setView('farms')}>
                                <Tractor className="mr-2 h-4 w-4" /> Farms
                            </Button>
                            <Button size="sm" variant={view === 'vets' ? 'default' : 'ghost'} onClick={() => setView('vets')}>
                                <Stethoscope className="mr-2 h-4 w-4" /> Vets
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[600px] w-full rounded-lg overflow-hidden border">
                        <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {view === 'farms' && mapData.farms.map(farm => (
                                <Marker key={farm._id} position={[farm.location.latitude, farm.location.longitude]} icon={farmIcon}>
                                    <Popup>
                                        <div className="font-bold">{farm.farmName}</div>
                                        <div>Owner: {farm.farmOwner}</div>
                                    </Popup>
                                </Marker>
                            ))}

                            {view === 'vets' && vetsWithLocation.map(vet => (
                                <Marker key={vet._id} position={[vet.location.latitude, vet.location.longitude]} icon={vetIcon}>
                                    <Popup>
                                        <div className="font-bold">{vet.fullName}</div>
                                        {vet.specialization && <div>Specialization: {vet.specialization}</div>}
                                        {vet.licenseNumber && <div>License: {vet.licenseNumber}</div>}
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    {view === 'vets' && vetsWithLocation.length === 0 && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-blue-800 text-sm">
                                <strong>No veterinarian locations available.</strong>
                                <p className="mt-1">Veterinarians need to set their practice location in their settings page to appear on the map.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MapViewPage;