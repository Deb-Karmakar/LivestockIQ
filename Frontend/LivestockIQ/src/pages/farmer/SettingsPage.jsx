import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
// CORRECTED: Changed to a relative path to ensure the build system can find it.
import { useAuth } from '../../contexts/AuthContext';
import { User, Tractor, Globe, Share2, Wifi, LogOut } from 'lucide-react';

// --- Main Settings Page Component ---
const SettingsPage = () => {
    const { user, logout } = useAuth();

    // In a real app, this data would be part of the user object
    const mockFarmData = {
        farmName: 'Green Valley Farms',
        farmType: 'Dairy Cattle',
        location: '28.6139, 77.2090', // Example coordinates
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings & Profile</h1>
                <p className="mt-1 text-gray-600">Manage your account, farm details, and application preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Profile and Farm Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Farmer Profile Card */}
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
                                    <Label htmlFor="ownerName">Full Name</Label>
                                    <Input id="ownerName" defaultValue={user?.farmOwner || 'Ramesh Kumar'} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact">Contact Number</Label>
                                    <Input id="contact" defaultValue="+91-9876543210" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" defaultValue={user?.email || 'ramesh@greenvalley.com'} disabled />
                            </div>
                            <div className="flex justify-end">
                                <Button>Save Profile</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Farm Details Card */}
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
                                    <Input id="farmName" defaultValue={mockFarmData.farmName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="farmType">Primary Farm Type</Label>
                                    <Input id="farmType" defaultValue={mockFarmData.farmType} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Farm Location (GPS Coordinates)</Label>
                                <Input id="location" defaultValue={mockFarmData.location} disabled />
                            </div>
                             <div className="flex justify-end">
                                <Button>Save Farm Details</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: App & Privacy Settings */}
                <div className="space-y-8">
                    {/* App Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>App Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Language</Label>
                                <Select defaultValue="en">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                                        <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="offline-sync" className="flex flex-col space-y-1">
                                    <span>Offline Sync</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Automatically sync data when online.
                                    </span>
                                </Label>
                                <Switch id="offline-sync" defaultChecked />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Consent & Privacy */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Consent & Privacy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between">
                                <Label htmlFor="data-sharing" className="flex flex-col space-y-1">
                                    <span>Data Sharing</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Allow access for regulatory bodies.
                                    </span>
                                </Label>
                                <Switch id="data-sharing" />
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

export default SettingsPage;

