// frontend/src/pages/regulator/MapViewPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Tractor, Stethoscope, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getMapData } from '../../services/regulatorService';

// 1. Import your custom pin image
import customPinIcon from '../../assets/generated_images/pin.png';

// 2. Custom Icon Definitions - Using L.Icon with your image
const farmIcon = new L.Icon({
    iconUrl: customPinIcon, // Use your custom pin image
    iconSize: [20, 20],      // Size of the icon
    iconAnchor: [16, 32],    // Point of the icon which will correspond to marker's location (bottom center)
    popupAnchor: [0, -32]    // Point from which the popup should open relative to the iconAnchor
});

// Using the same pin for vets, but slightly larger to differentiate
const vetIcon = new L.Icon({
    iconUrl: customPinIcon, // Using the same custom pin
    iconSize: [25, 25],     // Slightly larger for vets
    iconAnchor: [12, 25],   // Adjusted anchor point
    popupAnchor: [0, -25]   // Adjusted popup anchor
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

    // Default map center (India) and zoom level
    const mapCenter = [20.5937, 78.9629]; 
    const zoomLevel = 5;

    // Filter vets that have location data
    const vetsWithLocation = mapData.vets.filter(vet => 
        vet.location && 
        vet.location.latitude && 
        vet.location.longitude
    );

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Geospatial Analysis</h1>
                <p className="mt-1 text-gray-600">Visualize farm and vet locations on an interactive map.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Regional Map</CardTitle>
                            <CardDescription>
                                Showing {view === 'farms' 
                                    ? `${mapData.farms.length} Farm` 
                                    : `${vetsWithLocation.length} Veterinarian`} locations.
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
                <CardContent>
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

                    {/* Show info message when no vets have location data */}
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