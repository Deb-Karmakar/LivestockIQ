import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import districtsData from '@/data/districts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const RegulatorSignUpStep = ({ onBack }) => {
    const { registerRegulator } = useAuth();
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (registerRegulator) {
            await registerRegulator({
                ...data,
                state: selectedState,
                district: selectedDistrict
            });
        } else {
            alert("Regulator registration is not yet implemented in the backend.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-12">
            <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
                        <div>
                            <CardTitle className="text-2xl">Regulator Registration</CardTitle>
                            <CardDescription>Provide your official details to create a regulatory account.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-6">
                        {/* Section 1: Official Details */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">1. Official Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" name="fullName" placeholder="e.g., Priya Singh" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="agencyName">Regulatory Agency Name</Label>
                                    <Input id="agencyName" name="agencyName" placeholder="e.g., State Animal Husbandry Dept." required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="regulatorId">Official Regulator ID</Label>
                                    <Input id="regulatorId" name="regulatorId" placeholder="Your government-issued ID" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="jurisdiction">Jurisdiction</Label>
                                    <Input id="jurisdiction" name="jurisdiction" placeholder="e.g., State of Maharashtra" required />
                                </div>
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
                                                <SelectItem key={state} value={state}>
                                                    {state}
                                                </SelectItem>
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
                                                <SelectItem key={district} value={district}>
                                                    {district}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        {/* Section 2: Account Details */}
                        <div>
                            <h3 className="text-lg font-medium mb-2">2. Account Credentials</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Official Email Address</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" name="phoneNumber" type="tel" />
                                </div>
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
                                <Checkbox id="terms" required />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="terms" className="text-sm font-medium">
                                        I confirm that I am an authorized government official.
                                    </label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full bg-gray-700 hover:bg-gray-800">Create Regulator Account</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default RegulatorSignUpStep;
