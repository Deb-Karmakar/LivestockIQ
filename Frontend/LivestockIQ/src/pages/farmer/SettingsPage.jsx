import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '../../contexts/AuthContext';
import { User, Tractor, MapPin, LogOut, Loader2 } from 'lucide-react';
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
    
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!profile) return <div className="text-center p-8">Could not load profile data.</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Settings & Profile</h1>
                <p className="mt-1 text-gray-600">Manage your account, farm details, and application preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <User className="w-6 h-6" />
                                <div>
                                    <CardTitle>Farmer Profile</CardTitle>
                                    <CardDescription>Your personal account information.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <Button onClick={() => handleSaveChanges('profile')}>Save Profile</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Tractor className="w-6 h-6" />
                                <div>
                                    <CardTitle>Farm Details</CardTitle>
                                    <CardDescription>Information about your farming operation.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                    <Input id="herdSize" type="number" value={profile.herdSize || ''} onChange={handleInputChange} placeholder="e.g., 150"/>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Farm Location (GPS Coordinates)</Label>
                                <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                                    <Input value={profile.location ? `${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}` : 'No location set'} readOnly />
                                    <Button type="button" variant="outline" onClick={handleGetLocation}><MapPin className="mr-2 h-4 w-4"/> Update Location</Button>
                                </div>
                                <p className="text-xs text-gray-500 px-1">{locationMessage}</p>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handleSaveChanges('farm')}>Save Farm Details</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Account Actions</CardTitle></CardHeader>
                        <CardContent>
                            <Button variant="destructive" className="w-full" onClick={logout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
