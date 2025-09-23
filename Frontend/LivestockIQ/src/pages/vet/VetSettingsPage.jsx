// frontend/src/pages/vet/VetSettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { Stethoscope, Mail, Bell, LogOut, Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getVetProfile, updateVetProfile } from '@/services/vetService';

const VetSettingsPage = () => {
    const { logout } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    // NEW: State for location fetching feedback
    const [locationMessage, setLocationMessage] = useState('Click to fetch your current GPS coordinates.');

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getVetProfile();
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

    const handleSwitchChange = async (key, value) => {
        const updatedPrefs = { ...profile.notificationPrefs, [key]: value };
        setProfile(prev => ({ ...prev, notificationPrefs: updatedPrefs }));
        try {
            await updateVetProfile({ notificationPrefs: updatedPrefs });
            toast({ title: 'Success', description: 'Notification settings updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save notification settings.' });
            setProfile(prev => ({ ...prev, notificationPrefs: { ...prev.notificationPrefs, [key]: !value } }));
        }
    };

    // NEW: Function to get the vet's location
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            return toast({ variant: 'destructive', title: 'Error', description: "Geolocation is not supported by your browser." });
        }
        setLocationMessage("Fetching location...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setProfile(prev => ({ ...prev, location: { latitude, longitude } }));
                setLocationMessage('Location captured! Click "Save Contact Info" to apply.');
                toast({ title: 'Success', description: 'Location captured.' });
            },
            () => {
                setLocationMessage('Permission denied. Please enable location services.');
                toast({ variant: 'destructive', title: 'Location Error', description: 'Could not retrieve your location.' });
            }
        );
    };

    const handleSaveChanges = async (section) => {
        let dataToSave = {};
        if (section === 'professional') {
            dataToSave = { specialization: profile.specialization };
        } else if (section === 'contact') {
            // UPDATED: Now saves phone number AND location
            dataToSave = { phoneNumber: profile.phoneNumber, location: profile.location };
        }

        try {
            await updateVetProfile(dataToSave);
            toast({ title: 'Success', description: `${section === 'professional' ? 'Professional' : 'Contact'} details saved.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes.' });
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!profile) {
        return <div className="text-center p-8">Could not load profile data.</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Settings & Profile</h1>
                <p className="mt-1 text-gray-600">Manage your professional credentials and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Stethoscope className="w-6 h-6" />
                                <div>
                                    <CardTitle>Professional Profile</CardTitle>
                                    <CardDescription>Your verified credentials and specialization.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" value={profile.fullName || ''} onChange={handleInputChange} disabled />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="licenseNumber">Veterinary License Number</Label>
                                    <Input id="licenseNumber" value={profile.licenseNumber || ''} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Input id="specialization" value={profile.specialization || ''} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handleSaveChanges('professional')}>Save Professional Details</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Mail className="w-6 h-6" />
                                <div>
                                    <CardTitle>Contact & Account</CardTitle>
                                    <CardDescription>Manage your login and contact information.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" value={profile.email || ''} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" type="tel" value={profile.phoneNumber || ''} onChange={handleInputChange} />
                                </div>
                            </div>
                            
                            {/* NEW: Location fetching section */}
                            <div className="space-y-2">
                                <Label>Practice Location (for Regulator Map)</Label>
                                <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                                    <div className="flex-grow grid grid-cols-2 gap-2">
                                         <Input 
                                            value={profile.location ? profile.location.latitude.toFixed(6) : ''} 
                                            placeholder="Latitude" 
                                            readOnly 
                                         />
                                         <Input 
                                            value={profile.location ? profile.location.longitude.toFixed(6) : ''} 
                                            placeholder="Longitude" 
                                            readOnly 
                                         />
                                    </div>
                                    <Button type="button" variant="outline" onClick={handleGetLocation}>
                                        <MapPin className="w-4 h-4 mr-2"/> Get Location
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 px-1">{locationMessage}</p>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <Button variant="outline" disabled>Change Password (Soon)</Button>
                                <Button onClick={() => handleSaveChanges('contact')}>Save Contact Info</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Bell className="w-6 h-6" />
                                <CardTitle>Notifications</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="newRequests" className="font-normal">New Treatment Requests</Label>
                                <Switch id="newRequests" checked={profile.notificationPrefs.newRequests} onCheckedChange={(value) => handleSwitchChange('newRequests', value)} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="complianceAlerts" className="font-normal">Farm Compliance Alerts</Label>
                                <Switch id="complianceAlerts" checked={profile.notificationPrefs.complianceAlerts} onCheckedChange={(value) => handleSwitchChange('complianceAlerts', value)} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="weeklySummary" className="font-normal">Weekly Summary Email</Label>
                                <Switch id="weeklySummary" checked={profile.notificationPrefs.weeklySummary} onCheckedChange={(value) => handleSwitchChange('weeklySummary', value)} />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Button variant="destructive" className="w-full" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VetSettingsPage;