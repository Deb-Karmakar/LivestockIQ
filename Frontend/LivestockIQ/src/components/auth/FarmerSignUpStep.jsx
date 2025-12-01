import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import districtsData from '@/data/districts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const FarmerSignUpStep = ({ onBack }) => {
    const { register } = useAuth();
    const { toast } = useToast();

    // State to hold all form data, including location object
    const [formData, setFormData] = useState({
        farmOwner: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        farmName: '',
        vetId: '',
        state: '',
        district: '',
        location: null // Will hold { latitude, longitude }
    });

    const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
    const [locationError, setLocationError] = useState('');

    // Automatically fetch location when component mounts
    useEffect(() => {
        fetchLocation();
    }, []);

    const fetchLocation = () => {
        setLocationStatus('loading');
        setLocationError('');

        if (!navigator.geolocation) {
            setLocationStatus('error');
            setLocationError('Geolocation is not supported by your browser');
            toast({
                variant: 'destructive',
                title: 'Error',
                description: "Geolocation is not supported by your browser."
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                setFormData(prev => ({ ...prev, location: coords }));
                setLocationStatus('success');
                toast({
                    title: 'Success',
                    description: 'Farm location captured successfully!'
                });
                console.log('Location fetched:', coords);
            },
            (error) => {
                setLocationStatus('error');
                let errorMessage = 'Unable to fetch location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please enable location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred';
                }

                setLocationError(errorMessage);
                toast({
                    variant: 'destructive',
                    title: 'Location Error',
                    description: errorMessage
                });
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSignUp = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Passwords do not match!'
            });
            return;
        }

        // Warn if location is not available
        if (!formData.location) {
            const proceed = window.confirm(
                "Farm location is not available. Location helps track your animals and connect with vets. Do you want to continue without location?"
            );
            if (!proceed) return;
        }

        await register({
            ...formData,
            location: {
                ...formData.location,
                state: formData.state,
                district: formData.district
            }
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-12">
            <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl">
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
                        {/* Location Status Display */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-900">Farm Location Status:</span>
                                {locationStatus === 'loading' && (
                                    <span className="flex items-center gap-2 text-green-700">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Fetching your location...
                                    </span>
                                )}
                                {locationStatus === 'success' && (
                                    <span className="text-green-600 font-medium">
                                        ✓ Location captured successfully
                                    </span>
                                )}
                                {locationStatus === 'error' && (
                                    <span className="text-red-600">{locationError}</span>
                                )}
                            </div>
                            {locationStatus === 'error' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchLocation}
                                    className="mt-2"
                                >
                                    Retry Location Fetch
                                </Button>
                            )}
                            {locationStatus === 'success' && formData.location && (
                                <p className="text-xs text-gray-600 mt-1">
                                    Coordinates: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                                </p>
                            )}
                        </div>

                        {/* Personal & Account Details */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">1. Account Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="farmOwner">Full Name</Label>
                                    <Input
                                        id="farmOwner"
                                        value={formData.farmOwner}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        required
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="farmer@example.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
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
                                    <Input
                                        id="farmName"
                                        value={formData.farmName}
                                        onChange={handleChange}
                                        placeholder="Green Valley Farm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vetId">Veterinarian ID</Label>
                                    <Input
                                        id="vetId"
                                        placeholder="Enter the unique ID provided by your vet"
                                        value={formData.vetId}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-xs text-gray-500">
                                        Ask your veterinarian for their unique ID (e.g., x7b2k1j)
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Select
                                            onValueChange={(value) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    state: value,
                                                    district: '' // Reset district when state changes
                                                }));
                                            }}
                                            value={formData.state}
                                        >
                                            <SelectTrigger id="state">
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(districtsData).map((state) => (
                                                    <SelectItem key={state} value={state}>
                                                        {state}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="district">District</Label>
                                        <Select
                                            onValueChange={(value) => {
                                                setFormData(prev => ({ ...prev, district: value }));
                                            }}
                                            value={formData.district}
                                            disabled={!formData.state}
                                        >
                                            <SelectTrigger id="district">
                                                <SelectValue placeholder="Select District" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formData.state && districtsData[formData.state]?.map((district) => (
                                                    <SelectItem key={district} value={district}>
                                                        {district}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={locationStatus === 'loading'}
                        >
                            {locationStatus === 'loading' ? 'Fetching Location...' : 'Create Account'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default FarmerSignUpStep;