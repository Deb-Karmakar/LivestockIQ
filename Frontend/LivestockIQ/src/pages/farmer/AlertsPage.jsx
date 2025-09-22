import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, FileSignature, BrainCircuit, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// --- Mock Data ---
// In a real app, this data would be dynamically generated based on treatment records and vet signatures.
const operationalAlerts = [
    {
        id: 'alert-1',
        type: 'withdrawal',
        severity: 'destructive', // Red for high priority
        icon: <ShieldAlert className="h-4 w-4" />,
        title: "Withdrawal Nearing End: Animal C-012",
        description: "The withdrawal period for Enrofloxacin ends in 2 days. The animal will be safe for sale on Sep 18, 2025.",
        action: "View Treatment",
    },
    {
        id: 'alert-2',
        type: 'signature',
        severity: 'warning', // Amber for medium priority
        icon: <FileSignature className="h-4 w-4" />,
        title: "Vet Signature Required: Treatment TMT-003",
        description: "The treatment for animal 458921789123 (Ivermectin) is complete but awaits signature from Dr. Gupta for compliance.",
        action: "Notify Vet",
    },
    {
        id: 'alert-3',
        type: 'withdrawal',
        severity: 'warning',
        icon: <ShieldAlert className="h-4 w-4" />,
        title: "Withdrawal Nearing End: Animal C-009",
        description: "The withdrawal period for Tylosin ends in 5 days. The animal will be safe for sale on Sep 21, 2025.",
        action: "View Treatment",
    },
];


// --- Main Alerts Page Component ---

const AlertsPage = () => {
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
                <p className="mt-1 text-gray-600">Urgent tasks and AI-powered insights for your farm.</p>
            </div>

            {/* Section 1: Compliance & Operational Alerts */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Bell className="w-6 h-6 text-red-500" />
                        <div>
                            <CardTitle>Operational Alerts</CardTitle>
                            <CardDescription>Timely warnings based on your farm's treatment and compliance data.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {operationalAlerts.length > 0 ? (
                        operationalAlerts.map(alert => (
                            <Alert key={alert.id} variant={alert.severity}>
                                {alert.icon}
                                <div className="flex-grow">
                                    <AlertTitle>{alert.title}</AlertTitle>
                                    <AlertDescription>{alert.description}</AlertDescription>
                                </div>
                                <Button size="sm" variant={alert.severity === 'destructive' ? 'destructive' : 'secondary'}>{alert.action}</Button>
                            </Alert>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No active operational alerts. Your farm is compliant.</p>
                    )}
                </CardContent>
            </Card>

            {/* Section 2: AI-Powered Disease Surveillance */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                <CardHeader>
                     <div className="flex items-center gap-3">
                        <BrainCircuit className="w-6 h-6 text-indigo-600" />
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                AI Disease Outbreak Prediction
                                <Badge variant="outline" className="border-blue-400 text-blue-600">Coming Soon</Badge>
                            </CardTitle>
                            <CardDescription>Proactive insights to safeguard your herd's health.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 px-4 border-2 border-dashed border-blue-200 rounded-lg">
                        <p className="text-gray-700">
                            This upcoming feature will analyze your farm's location, local weather patterns, and regional health data to provide early warnings of potential disease outbreaks.
                        </p>
                        <Button className="mt-4" disabled>
                            Activate AI Monitoring (Unavailable)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AlertsPage;

