import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin } from 'lucide-react';

const FarmerSignUpStep = ({ onBack }) => {
    const { register } = useAuth();
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    
    // Updated state to include phoneNumber
    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '', farmOwner: '', phoneNumber: '',
        farmName: '', location: '', species: '', herdSize: '', vetId: ''
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSpeciesChange = (value) => {
        setFormData(prev => ({ ...prev, species: value }));
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, location: { latitude, longitude } }));
                setIsFetchingLocation(false);
            },
            (error) => {
                alert("Unable to retrieve your location.");
                setIsFetchingLocation(false);
            }
        );
    };
    
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
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
                        {/* Section 1: Personal Details */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">Personal Details</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="farmOwner">Full Name</Label>
                                        <Input id="farmOwner" placeholder="E.g., Rahul Sharma" value={formData.farmOwner} onChange={handleChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Input id="phoneNumber" type="tel" placeholder="+91 98765 43210" value={formData.phoneNumber} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        <Separator />

                        {/* Section 2: Farm & Professional Details */}
                        <div>
                             <h3 className="text-lg font-medium mb-2">Farm Details</h3>
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="farmName">Farm Name</Label>
                                    <Input id="farmName" placeholder="E.g., Green Valley Farms" value={formData.farmName} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Farm Location (GPS)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            id="locationDisplay" 
                                            value={formData.location ? `${formData.location.latitude.toFixed(5)}, ${formData.location.longitude.toFixed(5)}` : ''} 
                                            placeholder="Click button to fetch GPS" 
                                            readOnly 
                                        />
                                        <Button type="button" variant="outline" onClick={handleGetLocation} disabled={isFetchingLocation}>
                                            <MapPin className="w-4 h-4 mr-2"/>
                                            {isFetchingLocation ? 'Fetching...' : 'Get Location'}
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Species Reared</Label>
                                        <Select value={formData.species} onValueChange={handleSpeciesChange}>
                                            <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cattle">Cattle</SelectItem>
                                                <SelectItem value="poultry">Goat</SelectItem>
                                                <SelectItem value="sheep">Sheep</SelectItem>
                                                <SelectItem value="pig">Pig</SelectItem>
                                                <SelectItem value="mixed">Mixed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="herdSize">Herd Size</Label>
                                        <Input id="herdSize" type="number" placeholder="E.g., 50" value={formData.herdSize} onChange={handleChange} />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="vetId">Veterinarian ID</Label>
                                    <Input id="vetId" placeholder="Enter the unique ID provided by your vet" value={formData.vetId} onChange={handleChange} required />
                                    <p className="text-xs text-gray-500">This is required to link your account with your supervising veterinarian.</p>
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