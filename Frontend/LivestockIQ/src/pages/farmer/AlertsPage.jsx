import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, FileSignature, BrainCircuit, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getTreatments } from '../../services/treatmentService';
import { getMyHighAmuAlerts } from '../../services/farmerService';
import { useToast } from '../../hooks/use-toast';
import { differenceInDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';
import AmuAlertDetailsDialog from '../../components/AmuAlertDetailsDialog'; // 1. Import the new dialog

const AlertsPage = () => {
    const [treatments, setTreatments] = useState([]);
    const [highAmuAlerts, setHighAmuAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingHistoryOf, setViewingHistoryOf] = useState(null);
    const [viewingAlertDetails, setViewingAlertDetails] = useState(null); // 2. Add state for the new dialog
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchAlertData = useCallback(async () => {
        try {
            setLoading(true);
            const [treatmentsData, highAmuAlertsData] = await Promise.all([
                getTreatments(),
                getMyHighAmuAlerts()
            ]);
            setTreatments(treatmentsData || []);
            setHighAmuAlerts(highAmuAlertsData || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load alert data." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAlertData();
    }, [fetchAlertData]);

    const operationalAlerts = useMemo(() => {
        const alerts = [];
        const now = new Date();

        treatments.forEach(treatment => {
            if (treatment.status === 'Pending') {
                alerts.push({
                    id: `${treatment._id}-signature`, type: 'signature', severity: 'warning', icon: <FileSignature className="h-4 w-4" />,
                    title: `Vet Signature Required: Animal ${treatment.animalId}`,
                    description: `The treatment with ${treatment.drugName} is awaiting vet approval.`,
                    actionText: "View Treatments", animalId: treatment.animalId,
                });
            }
            if (treatment.status === 'Approved' && treatment.withdrawalEndDate) {
                const daysLeft = differenceInDays(new Date(treatment.withdrawalEndDate), now);
                if (daysLeft >= 0 && daysLeft <= 7) {
                    alerts.push({
                        id: `${treatment._id}-withdrawal`, type: 'withdrawal', severity: daysLeft <= 2 ? 'destructive' : 'warning',
                        icon: <ShieldAlert className="h-4 w-4" />, title: `Withdrawal Nearing End: Animal ${treatment.animalId}`,
                        description: `Withdrawal period ends in ${daysLeft} day(s).`,
                        actionText: "View History", animalId: treatment.animalId,
                    });
                }
            }
        });
        
        highAmuAlerts.forEach(alert => {
            alerts.push({
                id: alert._id, // Use the actual alert ID
                type: 'high_amu', severity: 'destructive', icon: <AlertCircle className="h-4 w-4" />,
                title: 'High Antimicrobial Usage Detected',
                description: alert.message,
                actionText: 'View Details',
            });
        });

        return alerts.sort((a, b) => (a.severity === 'destructive' ? -1 : 1));
    }, [treatments, highAmuAlerts]);

    // 3. Update the handleAlertAction function to open the new dialog
    const handleAlertAction = (alert) => {
        if (alert.type === 'signature') {
            navigate('/farmer/treatments');
        } else if (alert.type === 'withdrawal') {
            setViewingHistoryOf(alert.animalId);
        } else if (alert.type === 'high_amu') {
            setViewingAlertDetails(alert.id); // Open the details dialog with the alert's ID
        }
    };
    
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
                <p className="mt-1 text-gray-600">Urgent tasks and AI-powered insights for your farm.</p>
            </div>

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
                                <Button size="sm" variant={alert.severity === 'destructive' ? 'destructive' : 'secondary'} onClick={() => handleAlertAction(alert)}>
                                    {alert.actionText}
                                </Button>
                            </Alert>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No active operational alerts. Your farm is compliant.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                 <CardHeader>
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="w-6 h-6 text-indigo-600" />
                        <div>
                            <CardTitle className="flex items-center gap-2">AI Disease Outbreak Prediction<Badge variant="outline" className="border-blue-400 text-blue-600">Coming Soon</Badge></CardTitle>
                            <CardDescription>Proactive insights to safeguard your herd's health.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 px-4 border-2 border-dashed border-blue-200 rounded-lg">
                        <p className="text-gray-700">This upcoming feature will analyze your farm's location, local weather patterns, and regional health data to provide early warnings of potential disease outbreaks.</p>
                        <Button className="mt-4" disabled>Activate AI Monitoring (Unavailable)</Button>
                    </div>
                </CardContent>
            </Card>

            <AnimalHistoryDialog 
                animalId={viewingHistoryOf}
                isOpen={!!viewingHistoryOf}
                onClose={() => setViewingHistoryOf(null)}
            />

            {/* 4. Render the new AMU Alert Details Dialog */}
            <AmuAlertDetailsDialog
                alertId={viewingAlertDetails}
                isOpen={!!viewingAlertDetails}
                onClose={() => setViewingAlertDetails(null)}
            />
        </div>
    );
};

export default AlertsPage;