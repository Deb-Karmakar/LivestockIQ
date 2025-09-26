import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, FileSignature, ShieldAlert, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { differenceInDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';
import AmuAlertDetailsDialog from '../../components/AmuAlertDetailsDialog';
import { getTreatments } from '../../services/treatmentService';
// UPDATED: Import all three alert services
import { getMyHighAmuAlerts, getMyDiseaseAlerts } from '../../services/farmerService';

const AlertsPage = () => {
    const [treatments, setTreatments] = useState([]);
    const [highAmuAlerts, setHighAmuAlerts] = useState([]);
    const [diseaseAlerts, setDiseaseAlerts] = useState([]); // NEW: State for disease alerts
    const [loading, setLoading] = useState(true);
    const [viewingHistoryOf, setViewingHistoryOf] = useState(null);
    const [viewingAlertDetails, setViewingAlertDetails] = useState(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    // UPDATED: Fetch all three data sources
    const fetchAlertData = useCallback(async () => {
        try {
            setLoading(true);
            const [treatmentsData, highAmuAlertsData, diseaseAlertsData] = await Promise.all([
                getTreatments(),
                getMyHighAmuAlerts(),
                getMyDiseaseAlerts()
            ]);
            setTreatments(treatmentsData || []);
            setHighAmuAlerts(highAmuAlertsData || []);
            setDiseaseAlerts(diseaseAlertsData || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load alert data." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAlertData();
    }, [fetchAlertData]);

    // UPDATED: Generate alerts from all three sources
    const operationalAlerts = useMemo(() => {
        const alerts = [];
        const now = new Date();

        // 1. Generate alerts from treatments
        treatments.forEach(treatment => {
            if (treatment.status === 'Pending') {
                alerts.push({ id: `${treatment._id}-signature`, type: 'signature', severity: 'warning', icon: <FileSignature className="h-4 w-4" />, title: `Vet Signature Required: Animal ${treatment.animalId}`, description: `The treatment with ${treatment.drugName} is awaiting vet approval.`, actionText: "View Treatments" });
            }
            if (treatment.status === 'Approved' && treatment.withdrawalEndDate) {
                const daysLeft = differenceInDays(new Date(treatment.withdrawalEndDate), now);
                if (daysLeft >= 0 && daysLeft <= 7) {
                    alerts.push({ id: `${treatment._id}-withdrawal`, type: 'withdrawal', severity: daysLeft <= 2 ? 'destructive' : 'warning', icon: <ShieldAlert className="h-4 w-4" />, title: `Withdrawal Nearing End: Animal ${treatment.animalId}`, description: `Withdrawal period ends in ${daysLeft} day(s).`, actionText: "View History", animalId: treatment.animalId });
                }
            }
        });
        
        // 2. Generate alerts from highAmuAlerts
        highAmuAlerts.forEach(alert => {
            alerts.push({ id: alert._id, type: 'high_amu', severity: 'destructive', icon: <AlertCircle className="h-4 w-4" />, title: 'High Antimicrobial Usage Detected', description: alert.message, actionText: 'View Details' });
        });
        
        // 3. Generate alerts from diseaseAlerts
        diseaseAlerts.forEach(alert => {
            alerts.push({
                id: alert._id, type: 'disease_prediction', severity: 'destructive', icon: <Zap className="h-4 w-4" />,
                title: `Disease Risk Alert: ${alert.diseaseName}`, description: alert.message,
                actionText: 'View Prevention Tips', details: alert
            });
        });

        return alerts.sort((a, b) => (a.severity === 'destructive' ? -1 : 1));
    }, [treatments, highAmuAlerts, diseaseAlerts]);

    // UPDATED: Handle the action for the new disease alert type
    const handleAlertAction = (alert) => {
        if (alert.type === 'signature') {
            navigate('/farmer/treatments');
        } else if (alert.type === 'withdrawal') {
            setViewingHistoryOf(alert.animalId);
        } else if (alert.type === 'high_amu') {
            setViewingAlertDetails(alert.id);
        } else if (alert.type === 'disease_prediction') {
            toast({
                title: `Prevention Tips for ${alert.details.diseaseName}`,
                description: (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        {alert.details.preventiveMeasures.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                ),
            });
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
                            <CardTitle>Operational & Predictive Alerts</CardTitle>
                            <CardDescription>Timely warnings based on your farm's data and regional forecasts.</CardDescription>
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
                        <p className="text-sm text-gray-500 text-center py-4">No active alerts. Your farm is compliant.</p>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs for viewing details */}
            <AnimalHistoryDialog 
                animalId={viewingHistoryOf}
                isOpen={!!viewingHistoryOf}
                onClose={() => setViewingHistoryOf(null)}
            />
            <AmuAlertDetailsDialog
                alertId={viewingAlertDetails}
                isOpen={!!viewingAlertDetails}
                onClose={() => setViewingAlertDetails(null)}
            />
        </div>
    );
};

export default AlertsPage;