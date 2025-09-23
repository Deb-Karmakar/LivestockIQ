import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, FileSignature, BrainCircuit, ShieldAlert, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getTreatments } from '../../services/treatmentService';
import { useToast } from '../../hooks/use-toast';
import { differenceInDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';

const AlertsPage = () => {
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingHistoryOf, setViewingHistoryOf] = useState(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchLiveDate = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTreatments();
            setTreatments(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load treatment data for alerts." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLiveDate();
    }, [fetchLiveDate]);

    const operationalAlerts = useMemo(() => {
        const alerts = [];
        const now = new Date();

        treatments.forEach(treatment => {
            // Check for treatments needing a signature
            if (treatment.status === 'Pending') {
                alerts.push({
                    id: `${treatment._id}-signature`,
                    type: 'signature',
                    severity: 'warning',
                    icon: <FileSignature className="h-4 w-4" />,
                    title: `Vet Signature Required: Animal ${treatment.animalId}`,
                    description: `The treatment with ${treatment.drugName} on ${format(new Date(treatment.startDate), 'PPP')} is awaiting vet approval.`,
                    action: "View Treatment",
                    animalId: treatment.animalId, 
                });
            }

            // Check for upcoming withdrawal end dates
            if (treatment.status === 'Approved' && treatment.withdrawalEndDate) {
                const endDate = new Date(treatment.withdrawalEndDate);
                const daysLeft = differenceInDays(endDate, now);

                if (daysLeft >= 0 && daysLeft <= 7) {
                    alerts.push({
                        id: `${treatment._id}-withdrawal`,
                        type: 'withdrawal',
                        severity: daysLeft <= 2 ? 'destructive' : 'warning',
                        icon: <ShieldAlert className="h-4 w-4" />,
                        title: `Withdrawal Nearing End: Animal ${treatment.animalId}`,
                        description: `The withdrawal period for ${treatment.drugName} ends in ${daysLeft} day(s). The animal will be safe for sale on ${format(endDate, 'PPP')}.`,
                        action: "View Record",
                        animalId: treatment.animalId,
                    });
                }
            }
        });
        
        return alerts.sort((a, b) => (a.severity === 'destructive' ? -1 : 1));

    }, [treatments]);

    const handleAlertAction = (alert) => {
        if (alert.type === 'signature') {
            navigate('/farmer/treatments');
        } else if (alert.type === 'withdrawal') {
            setViewingHistoryOf(alert.animalId);
        }
    };

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
                    {loading ? (
                         <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : operationalAlerts.length > 0 ? (
                        operationalAlerts.map(alert => (
                            <Alert key={alert.id} variant={alert.severity}>
                                {alert.icon}
                                <div className="flex-grow">
                                    <AlertTitle>{alert.title}</AlertTitle>
                                    <AlertDescription>{alert.description}</AlertDescription>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant={alert.severity === 'destructive' ? 'destructive' : 'secondary'}
                                    onClick={() => handleAlertAction(alert)}
                                >
                                    {alert.action}
                                </Button>
                            </Alert>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No active operational alerts. Your farm is compliant.</p>
                    )}
                </CardContent>
            </Card>

            {/* Section 2: AI-Powered Disease Surveillance (Unchanged) */}
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

            <AnimalHistoryDialog 
                animalId={viewingHistoryOf}
                isOpen={!!viewingHistoryOf}
                onClose={() => setViewingHistoryOf(null)}
            />
        </div>
    );
};

export default AlertsPage;