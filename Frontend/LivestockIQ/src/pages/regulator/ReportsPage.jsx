import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

const ReportsPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Reports</h1>
                <p className="mt-1 text-gray-600">Generate and export official compliance documents.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Exportable Compliance Report</CardTitle>
                    <CardDescription>
                        Generate a comprehensive compliance report for a specified time period.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-center text-gray-500 py-8">
                        Report generation functionality will be implemented here.
                    </p>
                    <Button className="w-full" disabled>
                        <FileDown className="mr-2 h-4 w-4" />
                        Generate Report (Coming Soon)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsPage;
