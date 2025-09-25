import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const UserManagementPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="mt-1 text-gray-600">View, edit, and manage all users across the platform.</p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A table of all farmers, vets, and regulators will be here.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-center text-gray-500 py-12">User management table coming soon.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserManagementPage;