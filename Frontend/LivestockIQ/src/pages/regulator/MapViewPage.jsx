// frontend/src/pages/regulator/MapViewPage.jsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'; // Import the Leaflet library itself for custom icons
import { Tractor, Stethoscope } from 'lucide-react';

// --- Mock Data (Centered around Pune, India for realism) ---
const mockFarms = [
    { id: 'farm1', name: 'Green Valley Farms', owner: 'Rohan Patil', animals: 150, position: [18.5204, 73.8567] },
    { id: 'farm2', name: 'Sunrise Dairy', owner: 'Priya Deshmukh', animals: 200, position: [18.5626, 73.9181] },
    { id: 'farm3', name: 'Deccan Livestock', owner: 'Amit Kulkarni', animals: 80, position: [18.4739, 73.8373] },
];

const mockVets = [
    { id: 'vet1', name: 'Dr. Anjali Sharma', specialization: 'Large Animal Medicine', position: [18.5314, 73.8453] },
    { id: 'vet2', name: 'Dr. Vikram Singh', specialization: 'Poultry Health', position: [18.5196, 73.9032] },
];

// --- Custom Icon Definitions ---
// We use HTML and Tailwind to create custom icons for the map markers
const farmIcon = new L.DivIcon({
    html: `<div class="p-2 bg-green-500 rounded-full shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L22 10"/><path d="M11 18V8h5l4 4-4 4Z"/><path d="M14 18h-1a2 2 0 0 1-2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1.5"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></div>`,
    className: '', // Important to clear default styles
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const vetIcon = new L.DivIcon({
    html: `<div class="p-2 bg-blue-500 rounded-full shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M19.07 4.93l-1.41 1.41"/><path d="M4.93 19.07l-1.41 1.41"/><path d="M19.07 19.07l-1.41-1.41"/><path d="M4.93 4.93l-1.41-1.41"/><circle cx="12" cy="12" r="4"/><path d="M12 12a4.95 4.95 0 0 0 4.22 2.32A5 5 0 0 0 12 7a4.95 4.95 0 0 0-4.22 2.32A5 5 0 0 0 12 17Z"/></svg></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});


// --- Main Map View Page Component ---
const MapViewPage = () => {
    const [view, setView] = useState('farms'); // Can be 'farms' or 'vets'
    const mapCenter = [18.5204, 73.8567]; // Center of Pune
    const zoomLevel = 12;

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
                                Currently showing {view === 'farms' ? 'Farm' : 'Veterinarian'} locations. Click a marker for details.
                            </CardDescription>
                        </div>
                        {/* Toggle Buttons */}
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
                    {/* The Map Container */}
                    <div className="h-[600px] w-full rounded-lg overflow-hidden border">
                        <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            
                            {/* Conditionally render Farm Markers */}
                            {view === 'farms' && mockFarms.map(farm => (
                                <Marker key={farm.id} position={farm.position} icon={farmIcon}>
                                    <Popup>
                                        <div className="font-bold">{farm.name}</div>
                                        <div>Owner: {farm.owner}</div>
                                        <div>Animal Count: {farm.animals}</div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Conditionally render Vet Markers */}
                            {view === 'vets' && mockVets.map(vet => (
                                <Marker key={vet.id} position={vet.position} icon={vetIcon}>
                                    <Popup>
                                        <div className="font-bold">{vet.name}</div>
                                        <div>{vet.specialization}</div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MapViewPage;