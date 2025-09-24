// frontend/src/pages/regulator/SettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Bell, LogOut, Loader2 } from 'lucide-react';
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
            // Revert on failure
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
    
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!profile) return <div className="text-center p-8">Could not load profile data.</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Settings & Profile</h1>
                <p className="mt-1 text-gray-600">Manage your official credentials and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Official Details</CardTitle>
                            <CardDescription>This information is for identification and cannot be changed.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Full Name</Label><Input value={profile.fullName} disabled /></div>
                                <div className="space-y-2"><Label>Official ID</Label><Input value={profile.regulatorId} disabled /></div>
                                <div className="space-y-2"><Label>Agency Name</Label><Input value={profile.agencyName} disabled /></div>
                                <div className="space-y-2"><Label>Jurisdiction</Label><Input value={profile.jurisdiction} disabled /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Email</Label><Input value={profile.email} disabled /></div>
                                <div className="space-y-2"><Label>Phone Number</Label><Input id="phoneNumber" value={profile.phoneNumber || ''} onChange={handleInputChange} /></div>
                             </div>
                             <div className="flex justify-end"><Button onClick={handleSaveContact}>Save Contact Info</Button></div>
                         </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
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