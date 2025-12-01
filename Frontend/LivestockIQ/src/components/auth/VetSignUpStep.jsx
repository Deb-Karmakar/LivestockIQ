import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CalendarIcon, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import districtsData from '@/data/districts';

const VetSignUpStep = ({ onBack }) => {
    const { registerVet } = useAuth();
    const [dob, setDob] = useState(null);
    const [location, setLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
    const [locationError, setLocationError] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // Fetch location when component mounts
    useEffect(() => {
        fetchLocation();
    }, []);

    const fetchLocation = () => {
        setLocationStatus('loading');
        setLocationError('');

        if (!navigator.geolocation) {
            setLocationStatus('error');
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                setLocation(coords);
                setLocationStatus('success');
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
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleSignUp = async (e) => {
        e.preventDefault();

        // Collect all form data using their 'name' attributes
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Warn if location is not available
        if (!location) {
            const proceed = window.confirm(
                "Location data is not available. Your location helps farmers find you. Do you want to continue without location?"
            );
            if (!proceed) return;
        }

        // Call the registerVet function with complete form data including location
        await registerVet({
            ...data,
            dob: dob,
            location: {
                ...(location || {}),
                state: selectedState,
                district: selectedDistrict
            }
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-12">
            <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <CardTitle className="text-2xl">Veterinarian Registration</CardTitle>
                            <CardDescription>Provide your professional details to create a verified account.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-6">
                        {/* Location Status Display */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-blue-900">Location Status:</span>
                                {locationStatus === 'loading' && (
                                    <span className="flex items-center gap-2 text-blue-700">
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
                            {locationStatus === 'success' && location && (
                                <p className="text-xs text-gray-600 mt-1">
                                    Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            )}
                        </div>

                        {/* State and District Dropdowns */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Select
                                    onValueChange={(value) => {
                                        setSelectedState(value);
                                        setSelectedDistrict('');
                                    }}
                                    value={selectedState}
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
                                    onValueChange={setSelectedDistrict}
                                    value={selectedDistrict}
                                    disabled={!selectedState}
                                >
                                    <SelectTrigger id="district">
                                        <SelectValue placeholder="Select District" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedState && districtsData[selectedState]?.map((district) => (
                                            <SelectItem key={district} value={district}>
                                                {district}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Section 1: Personal Info */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">1. Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" name="fullName" placeholder="Dr. Aditya Sharma" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select name="gender">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={dob} onSelect={setDob} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <Separator />

                        {/* Section 2: Professional Details */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">2. Professional Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="licenseNumber">Veterinary License Number</Label>
                                    <Input id="licenseNumber" name="licenseNumber" placeholder="e.g., APSVC/12345/2020" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="university">University / College Name</Label>
                                    <Input id="university" name="university" placeholder="e.g., Mumbai Veterinary College" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="degree">Graduation Year / Degree</Label>
                                    <Input id="degree" name="degree" placeholder="2015 / B.V.Sc" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Input id="specialization" name="specialization" placeholder="e.g., Large Animal Medicine" />
                                </div>
                            </div>
                        </div>
                        <Separator />

                        {/* Section 3: Account & Consent */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">3. Account & Consent</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" name="phoneNumber" type="tel" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input id="confirmPassword" name="confirmPassword" type="password" required />
                                </div>
                            </div>
                            <div className="items-top flex space-x-2 mt-4">
                                <Checkbox id="info-accurate" name="infoAccurate" required />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="info-accurate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        I confirm that the information provided is accurate.
                                    </label>
                                </div>
                            </div>
                            <div className="items-top flex space-x-2 mt-2">
                                <Checkbox id="data-consent" name="dataConsent" required />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="data-consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        I consent to share data with farmers and regulatory authorities as per the platform's terms.
                                    </label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                            Create Veterinarian Account
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default VetSignUpStep;