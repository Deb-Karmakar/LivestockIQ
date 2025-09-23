import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SettingsPage = () => {
    const { logout } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="mt-1 text-gray-600">Manage your account preferences.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Account Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-500 py-12">
                        Profile and notification settings will be available here soon.
                    </p>
                    <Button variant="destructive" className="w-full" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
