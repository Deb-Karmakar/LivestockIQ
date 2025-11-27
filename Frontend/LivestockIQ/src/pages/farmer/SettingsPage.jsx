import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '../../contexts/AuthContext';
import { User, Tractor, MapPin, LogOut, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getMyProfile, updateMyProfile } from '../../services/farmerService';

const SettingsPage = () => {
    const { logout } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationMessage, setLocationMessage] = useState('Click to update your farm\'s GPS coordinates.');

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMyProfile();
            setProfile(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load profile data.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setProfile(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (value) => {
        setProfile(prev => ({ ...prev, speciesReared: value }));
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            return toast({ variant: 'destructive', title: 'Error', description: "Geolocation is not supported by your browser." });
        }
        setLocationMessage("Fetching location...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setProfile(prev => ({ ...prev, location: { latitude, longitude } }));
                setLocationMessage('Location captured! Click "Save Farm Details" to apply.');
                toast({ title: 'Success', description: 'Location captured.' });
            },
            () => {
                setLocationMessage('Permission denied. Please enable location services.');
                toast({ variant: 'destructive', title: 'Location Error', description: 'Could not retrieve your location.' });
            }
        );
    };

    const handleSaveChanges = async (section) => {
        try {
            let dataToSave = {};
            if (section === 'profile') {
                dataToSave = { farmOwner: profile.farmOwner, phoneNumber: profile.phoneNumber };
            } else if (section === 'farm') {
                dataToSave = {
                    farmName: profile.farmName,
                    speciesReared: profile.speciesReared,
                    herdSize: profile.herdSize,
                    location: profile.location
                };
            }
            await updateMyProfile(dataToSave);
            toast({ title: "Success", description: `${section === 'profile' ? 'Profile' : 'Farm'} details have been saved.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save changes." });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading settings...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Could not load profile data.</p>
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
                            <span>Account Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Settings & Profile
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Manage your account, farm details, and application preferences. Keep your information up to date for better service.
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* Farmer Profile Card */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>Farmer Profile</CardTitle>
                                    <CardDescription>Your personal account information</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="farmOwner">Full Name</Label>
                                    <Input id="farmOwner" value={profile.farmOwner || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Contact Number</Label>
                                    <Input id="phoneNumber" value={profile.phoneNumber || ''} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={profile.email || ''} disabled />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handleSaveChanges('profile')} className="bg-emerald-500 hover:bg-emerald-600">
                                    Save Profile
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Farm Details Card */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-xl">
                                    <Tractor className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle>Farm Details</CardTitle>
                                    <CardDescription>Information about your farming operation</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="farmName">Farm Name</Label>
                                    <Input id="farmName" value={profile.farmName || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vetId">Supervising Vet ID</Label>
                                    <Input id="vetId" value={profile.vetId || ''} disabled />
                                </div>

                                <div className="space-y-2">
                                    <Label>Primary Species Reared</Label>
                                    <Select value={profile.speciesReared || ''} onValueChange={handleSelectChange}>
                                        <SelectTrigger><SelectValue placeholder="Select a species..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cattle">Cattle</SelectItem>
                                            <SelectItem value="Goat">Goat</SelectItem>
                                            <SelectItem value="Sheep">Sheep</SelectItem>
                                            <SelectItem value="Pig">Pig</SelectItem>
                                            <SelectItem value="Buffalo">Buffalo</SelectItem>
                                            <SelectItem value="Mixed">Mixed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="herdSize">Total Herd Size</Label>
                                    <Input id="herdSize" type="number" value={profile.herdSize || ''} onChange={handleInputChange} placeholder="e.g., 150" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Farm Location (GPS Coordinates)</Label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 border rounded-md bg-slate-50">
                                    <Input value={profile.location ? `${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}` : 'No location set'} readOnly className="flex-1" />
                                    <Button type="button" variant="outline" onClick={handleGetLocation} className="w-full sm:w-auto">
                                        <MapPin className="mr-2 h-4 w-4" /> Update Location
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 px-1">{locationMessage}</p>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handleSaveChanges('farm')} className="bg-emerald-500 hover:bg-emerald-600">
                                    Save Farm Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Account Actions Card */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-xl">
                                    <SettingsIcon className="w-5 h-5 text-purple-600" />
                                </div>
                                <CardTitle>Account Actions</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Button variant="destructive" className="w-full" onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card className="border-0 shadow-lg bg-blue-50">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-blue-900 mb-2 text-sm">Profile Tips</h3>
                            <ul className="text-xs text-blue-800 space-y-2">
                                <li>• Keep your contact information current</li>
                                <li>• Update GPS location for accurate mapping</li>
                                <li>• Ensure herd size is up to date</li>
                                <li>• Contact support to change vet assignment</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
