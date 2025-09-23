import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin } from 'lucide-react';

const FarmerSignUpStep = ({ onBack }) => {
    const { register } = useAuth();
    const { toast } = useToast();
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    
    // State to hold all form data, including location object
    const [formData, setFormData] = useState({
        farmOwner: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        farmName: '',
        vetId: '',
        location: null // Will hold { latitude, longitude }
    });
    
    // State for providing user feedback on location fetching
    const [locationMessage, setLocationMessage] = useState('Click button to get your farm\'s current location.');

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocationMessage("Geolocation is not supported by your browser.");
            toast({ variant: 'destructive', title: 'Error', description: "Geolocation is not supported." });
            return;
        }
        setIsFetchingLocation(true);
        setLocationMessage("Fetching location...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, location: { latitude, longitude } }));
                setLocationMessage('Location captured successfully!');
                toast({ title: 'Success', description: 'GPS coordinates have been captured.' });
                setIsFetchingLocation(false);
            },
            (error) => {
                setLocationMessage('Permission denied. Please enable location services in your browser settings.');
                toast({ variant: 'destructive', title: 'Location Error', description: 'Could not retrieve your location.' });
                setIsFetchingLocation(false);
            }
        );
    };
    
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match!' });
            return;
        }
        // Ensure location is not null before registering
        if (!formData.location) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide your farm location.' });
            return;
        }
        await register(formData);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <CardTitle className="text-2xl">Farmer Registration</CardTitle>
                            <CardDescription>Create your LivestockIQ account.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-6">
                        {/* Personal & Account Details */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">1. Account Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="farmOwner">Full Name</Label>
                                    <Input id="farmOwner" value={formData.farmOwner} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Farm & Professional Details */}
                        <div>
                             <h3 className="text-lg font-medium mb-2">2. Farm Details</h3>
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="farmName">Farm Name</Label>
                                    <Input id="farmName" value={formData.farmName} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Farm Location (GPS)</Label>
                                    <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                                        <div className="flex-grow grid grid-cols-2 gap-2">
                                             <Input 
                                                id="latitude" 
                                                value={formData.location ? formData.location.latitude.toFixed(6) : ''} 
                                                placeholder="Latitude" 
                                                readOnly 
                                             />
                                             <Input 
                                                id="longitude" 
                                                value={formData.location ? formData.location.longitude.toFixed(6) : ''} 
                                                placeholder="Longitude" 
                                                readOnly 
                                             />
                                        </div>
                                        <Button type="button" variant="outline" onClick={handleGetLocation} disabled={isFetchingLocation}>
                                            <MapPin className="w-4 h-4 mr-2"/>
                                            {isFetchingLocation ? 'Fetching...' : 'Get'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 px-1">{locationMessage}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vetId">Veterinarian ID</Label>
                                    <Input id="vetId" placeholder="Enter the unique ID provided by your vet" value={formData.vetId} onChange={handleChange} required />
                                </div>
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Create Account</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default FarmerSignUpStep;