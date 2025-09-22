import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Megaphone, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// --- Mock Data ---
const mockAlerts = [
    {
        id: 'alert-vet-1',
        severity: 'destructive',
        title: "Potential Misuse Detected: Farm 'Green Valley Farms'",
        description: "Repeated logging of Enrofloxacin at 2x the recommended dosage for animal '342987123456'. This requires immediate review.",
        actionable: true,
    },
    {
        id: 'alert-vet-2',
        severity: 'warning',
        title: "Withdrawal Nearing End: Farm 'Sunrise Dairy'",
        description: "Animal 'C-203' will complete its withdrawal period for Tylosin in 2 days. Please confirm with the farmer.",
        actionable: false,
    },
    {
        id: 'alert-vet-3',
        severity: 'warning',
        title: "Potential Treatment Conflict: Farm 'Green Valley Farms'",
        description: "Two antibiotics with similar action spectra were administered to animal '342987123457' within 48 hours. Please review the treatment log.",
        actionable: false,
    },
];

// --- Main Vet's Alerts Page Component ---
const VetAlertsPage = () => {
    const [alerts, setAlerts] = useState(mockAlerts);
    const [selectedAlert, setSelectedAlert] = useState(null);

    const handleRaiseComplaint = () => {
        // In a real app, this would submit the complaint details to the backend.
        alert(`Complaint against '${selectedAlert.title}' has been submitted to the authorities.`);
        setSelectedAlert(null); // Close the dialog
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Farm Compliance Alerts</h1>
                <p className="mt-1 text-gray-600">Monitor potential treatment issues and misuse across assigned farms.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Alerts</CardTitle>
                    <CardDescription>
                        You have {alerts.length} active alerts that may require your attention.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {alerts.map(alert => (
                        <Alert key={alert.id} variant={alert.severity}>
                            <ShieldAlert className="h-4 w-4" />
                            <div className="flex-grow">
                                <AlertTitle className="font-bold">{alert.title}</AlertTitle>
                                <AlertDescription>{alert.description}</AlertDescription>
                            </div>
                            {alert.actionable && (
                                <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm" onClick={() => setSelectedAlert(alert)}>
                                            <Megaphone className="mr-2 h-4 w-4" />
                                            Raise Complaint
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                            )}
                        </Alert>
                    ))}
                    {alerts.length === 0 && (
                         <p className="text-sm text-gray-500 text-center py-4">No active alerts. All supervised farms are compliant.</p>
                    )}
                </CardContent>
            </Card>

            {/* Raise Complaint Dialog */}
            {selectedAlert && (
                 <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Raise Complaint to Authority</DialogTitle>
                            <DialogDescription>
                                You are about to report the following issue. Please provide a brief summary. This action will be logged.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <Card className="bg-gray-50 p-4">
                                <p className="font-semibold text-sm">Alert Details:</p>
                                <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
                            </Card>
                             <div className="space-y-2">
                                <Label htmlFor="complaint-details">Complaint Summary</Label>
                                <Textarea id="complaint-details" placeholder="Provide a brief, factual summary of the issue for the authorities..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedAlert(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleRaiseComplaint}>
                                <Send className="mr-2 h-4 w-4" /> Submit Complaint
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default VetAlertsPage;