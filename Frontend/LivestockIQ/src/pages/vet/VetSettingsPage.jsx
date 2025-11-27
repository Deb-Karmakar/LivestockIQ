// frontend/src/pages/vet/VetSettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { Stethoscope, Mail, Bell, LogOut, MapPin, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getVetProfile, updateVetProfile } from '@/services/vetService';

const VetSettingsPage = () => {
    const { logout } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
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
                            Manage your professional credentials and notification preferences. Keep your information up to date.
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* Professional Profile */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <Stethoscope className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>Professional Profile</CardTitle>
                                    <CardDescription>Your verified credentials and specialization</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
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
                                <Button onClick={() => handleSaveChanges('professional')} className="bg-emerald-500 hover:bg-emerald-600">
                                    Save Professional Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact & Account */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-xl">
                                    <Mail className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle>Contact & Account</CardTitle>
                                    <CardDescription>Manage your login and contact information</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
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

                            <div className="space-y-2">
                                <Label>Practice Location (for Regulator Map)</Label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 border rounded-md bg-slate-50">
                                    <Input
                                        value={profile.location ? `${profile.location.latitude.toFixed(6)}, ${profile.location.longitude.toFixed(6)}` : 'No location set'}
                                        readOnly
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" onClick={handleGetLocation} className="w-full sm:w-auto">
                                        <MapPin className="w-4 h-4 mr-2" /> Get Location
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 px-1">{locationMessage}</p>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={() => handleSaveChanges('contact')} className="bg-emerald-500 hover:bg-emerald-600">
                                    Save Contact Info
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Notifications */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-xl">
                                    <Bell className="w-5 h-5 text-purple-600" />
                                </div>
                                <CardTitle>Notifications</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="newRequests" className="font-normal text-sm">New Treatment Requests</Label>
                                <Switch id="newRequests" checked={profile.notificationPrefs.newRequests} onCheckedChange={(value) => handleSwitchChange('newRequests', value)} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="complianceAlerts" className="font-normal text-sm">Farm Compliance Alerts</Label>
                                <Switch id="complianceAlerts" checked={profile.notificationPrefs.complianceAlerts} onCheckedChange={(value) => handleSwitchChange('complianceAlerts', value)} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="weeklySummary" className="font-normal text-sm">Weekly Summary Email</Label>
                                <Switch id="weeklySummary" checked={profile.notificationPrefs.weeklySummary} onCheckedChange={(value) => handleSwitchChange('weeklySummary', value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Actions */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-xl">
                                    <SettingsIcon className="w-5 h-5 text-orange-600" />
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
                </div>
            </div>
        </div>
    );
};

export default VetSettingsPage;