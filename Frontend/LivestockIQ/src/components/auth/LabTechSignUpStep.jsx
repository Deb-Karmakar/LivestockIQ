import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Loader2, FlaskConical } from 'lucide-react';
import districtsData from '@/data/districts';

const LabTechSignUpStep = ({ onBack }) => {
    const { registerLabTechnician } = useAuth();
    const [location, setLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle');
    const [locationError, setLocationError] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.confirmPassword) {
            alert("Passwords do not match!");
            setIsSubmitting(false);
            return;
        }

        if (!location) {
            const proceed = window.confirm(
                "Location data is not available. Do you want to continue without location?"
            );
            if (!proceed) {
                setIsSubmitting(false);
                return;
            }
        }

        try {
            await registerLabTechnician({
                ...data,
                location: {
                    ...(location || {}),
                    state: selectedState,
                    district: selectedDistrict
                }
            });
        } catch (error) {
            console.error("Registration error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-12">
            <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FlaskConical className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Lab Technician Registration</CardTitle>
                                <CardDescription>Create your lab professional account</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-6">
                        {/* Location Status */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-purple-600" />
                                <span className="font-medium text-purple-900">Location Status:</span>
                                {locationStatus === 'loading' && (
                                    <span className="flex items-center gap-2 text-purple-700">
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
                                <Button type="button" variant="outline" size="sm" onClick={fetchLocation} className="mt-2">
                                    Retry Location Fetch
                                </Button>
                            )}
                            {locationStatus === 'success' && location && (
                                <p className="text-xs text-gray-600 mt-1">
                                    Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            )}
                        </div>

                        {/* State and District */}
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
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
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
                                            <SelectItem key={district} value={district}>{district}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Section 1: Personal Info */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">1. Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" name="fullName" placeholder="e.g., Dr. Priya Sharma" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+91 98765 43210" />
                                </div>
                            </div>
                        </div>
                        <Separator />

                        {/* Section 2: Lab Details */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">2. Laboratory Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="labName">Laboratory Name</Label>
                                    <Input id="labName" name="labName" placeholder="e.g., City Veterinary Lab" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="labCertificationNumber">Lab Certification Number</Label>
                                    <Input id="labCertificationNumber" name="labCertificationNumber" placeholder="e.g., NABL/LAB/2024/001" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Select name="specialization" defaultValue="MRL Testing">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select specialization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MRL Testing">MRL Testing</SelectItem>
                                            <SelectItem value="Pathology">Pathology</SelectItem>
                                            <SelectItem value="Microbiology">Microbiology</SelectItem>
                                            <SelectItem value="General">General</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="labLocation">Lab Address (Optional)</Label>
                                    <Input id="labLocation" name="labLocation" placeholder="Lab street address" />
                                </div>
                            </div>
                        </div>
                        <Separator />

                        {/* Section 3: Account */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">3. Account Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div></div>
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
                                    <label htmlFor="info-accurate" className="text-sm font-medium leading-none">
                                        I confirm that the information provided is accurate.
                                    </label>
                                </div>
                            </div>
                            <div className="items-top flex space-x-2 mt-2">
                                <Checkbox id="data-consent" name="dataConsent" required />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="data-consent" className="text-sm font-medium leading-none">
                                        I consent to share test data with farmers and regulatory authorities.
                                    </label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Lab Technician Account'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LabTechSignUpStep;
