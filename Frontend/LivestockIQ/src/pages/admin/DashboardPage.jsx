import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboardPage = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="mt-1 text-gray-600">Welcome, {user?.fullName || 'Admin'}.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-500 py-12">
                        High-level system statistics will be displayed here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboardPage;