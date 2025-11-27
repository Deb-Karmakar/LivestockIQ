// frontend/src/pages/regulator/SettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRegulatorProfile, updateRegulatorProfile } from '@/services/regulatorService';

const SettingsPage = () => {
    const { logout } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getRegulatorProfile();
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
            await updateRegulatorProfile({ notificationPrefs: updatedPrefs });
            toast({ title: 'Success', description: 'Notification settings updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
            setProfile(prev => ({ ...prev, notificationPrefs: { ...prev.notificationPrefs, [key]: !value } }));
        }
    };

    const handleSaveContact = async () => {
        try {
            await updateRegulatorProfile({ phoneNumber: profile.phoneNumber });
            toast({ title: 'Success', description: `Contact details saved.` });
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
                            <span>Settings & Profile</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Settings & Profile
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Manage your official credentials and notification preferences.
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <CardTitle>Official Details</CardTitle>
                            <CardDescription>This information is for identification and cannot be changed</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Full Name</Label><Input value={profile.fullName} disabled /></div>
                                <div className="space-y-2"><Label>Official ID</Label><Input value={profile.regulatorId} disabled /></div>
                                <div className="space-y-2"><Label>Agency Name</Label><Input value={profile.agencyName} disabled /></div>
                                <div className="space-y-2"><Label>Jurisdiction</Label><Input value={profile.jurisdiction} disabled /></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Email</Label><Input value={profile.email} disabled /></div>
                                <div className="space-y-2"><Label>Phone Number</Label><Input id="phoneNumber" value={profile.phoneNumber || ''} onChange={handleInputChange} /></div>
                            </div>
                            <div className="flex justify-end"><Button onClick={handleSaveContact}>Save Contact Info</Button></div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <CardTitle>Notifications</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="highAmuAlerts" className="font-normal">High AMU Alerts</Label>
                                <Switch id="highAmuAlerts" checked={profile.notificationPrefs.highAmuAlerts} onCheckedChange={(value) => handleSwitchChange('highAmuAlerts', value)} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="vetComplianceReports" className="font-normal">Vet Compliance Reports</Label>
                                <Switch id="vetComplianceReports" checked={profile.notificationPrefs.vetComplianceReports} onCheckedChange={(value) => handleSwitchChange('vetComplianceReports', value)} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="monthlySummary" className="font-normal">Monthly Summary Email</Label>
                                <Switch id="monthlySummary" checked={profile.notificationPrefs.monthlySummary} onCheckedChange={(value) => handleSwitchChange('monthlySummary', value)} />
                            </div>
                        </CardContent>
                    </Card>
                    <Button variant="destructive" className="w-full" onClick={logout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;