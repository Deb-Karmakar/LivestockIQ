import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminSettingsPage = () => {
    const { logout } = useAuth();
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Admin Settings</h1>
                <p className="mt-1 text-gray-600">Manage your administrator account.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" className="w-full" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSettingsPage;