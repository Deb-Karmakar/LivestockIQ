import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { User, Stethoscope, Mail, Bell, LogOut } from 'lucide-react';

// --- Main Vet's Settings Page Component ---
const VetSettingsPage = () => {
    const { user, logout } = useAuth();

    // In a real app, this data would be part of the vet's user object from the context
    const mockVetProfile = {
        name: 'Dr. Anjali Sharma',
        license: 'VCI/12345',
        specialization: 'Large Animal Medicine',
        phone: '+91-9123456789',
        email: 'anjali.sharma@vet.com',
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings & Profile</h1>
                <p className="mt-1 text-gray-600">Manage your professional credentials and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Profile Information */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Professional Details Card */}
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
                                <Input id="fullName" defaultValue={mockVetProfile.name} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="license">Veterinary License Number</Label>
                                    <Input id="license" defaultValue={mockVetProfile.license} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Input id="specialization" defaultValue={mockVetProfile.specialization} />
                                </div>
                            </div>
                             <div className="flex justify-end">
                                <Button>Save Professional Details</Button>
                            </div>
                        </CardContent>
                    </Card>

                     {/* Contact & Account Card */}
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
                                    <Input id="email" type="email" defaultValue={mockVetProfile.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" type="tel" defaultValue={mockVetProfile.phone} />
                                </div>
                            </div>
                             <div className="flex justify-between items-center pt-2">
                                <Button variant="outline">Change Password</Button>
                                <Button>Save Contact Info</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Notifications & Logout */}
                <div className="space-y-8">
                    {/* Notification Preferences */}
                    <Card>
                        <CardHeader>
                             <div className="flex items-center gap-3">
                                <Bell className="w-6 h-6" />
                                <CardTitle>Notifications</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between">
                                <Label htmlFor="new-requests" className="font-normal">New Treatment Requests</Label>
                                <Switch id="new-requests" defaultChecked />
                            </div>
                             <Separator />
                             <div className="flex items-center justify-between">
                                <Label htmlFor="compliance-alerts" className="font-normal">Farm Compliance Alerts</Label>
                                <Switch id="compliance-alerts" defaultChecked />
                            </div>
                             <Separator />
                              <div className="flex items-center justify-between">
                                <Label htmlFor="weekly-summary" className="font-normal">Weekly Summary Email</Label>
                                <Switch id="weekly-summary" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Logout Button */}
                    <Button variant="destructive" className="w-full" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VetSettingsPage;