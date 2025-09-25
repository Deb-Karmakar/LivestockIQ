import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SupportPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Support Tickets</h1>
                <p className="mt-1 text-gray-600">View and resolve user-submitted support requests.</p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Open Tickets</CardTitle>
                     <CardDescription>A list of support tickets will be displayed here.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-center text-gray-500 py-12">Support ticket system coming soon.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default SupportPage;