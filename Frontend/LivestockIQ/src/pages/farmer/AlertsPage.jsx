import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, FileSignature, ShieldAlert, AlertCircle, Zap, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { differenceInDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AnimalHistoryDialog from '../../components/AnimalHistoryDialog';
import AmuAlertDetailsDialog from '../../components/AmuAlertDetailsDialog';
import { getTreatments } from '../../services/treatmentService';
import { getMyHighAmuAlerts, getMyDiseaseAlerts } from '../../services/farmerService';

// Animated Counter Component
const AnimatedCounter = ({ value }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (typeof value !== 'number') {
            setCount(value);
            return;
        }
        let start = 0;
        const end = value;
        const duration = 1000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{count}</span>;
};

// Stat Card Component
const StatCard = ({ title, value, color, subtitle }) => {
    const colorClasses = {
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/25',
        red: 'from-red-500 to-red-600 shadow-red-500/25',
    };

    return (
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-[0.03]`} />
            <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                            <AnimatedCounter value={value} />
                        </span>
                    </div>
                    {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
};

const AlertsPage = () => {
    const [treatments, setTreatments] = useState([]);
    const [highAmuAlerts, setHighAmuAlerts] = useState([]);
    const [diseaseAlerts, setDiseaseAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingHistoryOf, setViewingHistoryOf] = useState(null);
    const [viewingAlertDetails, setViewingAlertDetails] = useState(null);
    const { toast } = useToast();
    const navigate = useNavigate();

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading alerts...</p>
            </div>
        );
    }

    // Calculate stats
    const stats = {
        totalAlerts: operationalAlerts.length,
        critical: operationalAlerts.filter(a => a.severity === 'destructive').length,
        warnings: operationalAlerts.filter(a => a.severity === 'warning').length,
        pending: treatments.filter(t => t.status === 'Pending').length
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Alert Center</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Alerts & Notifications
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Urgent tasks and AI-powered insights for your farm. You have{' '}
                            <span className="text-red-400 font-semibold">{stats.critical} critical alerts</span> and{' '}
                            <span className="text-amber-400 font-semibold">{stats.warnings} warnings</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Total Alerts"
                    value={stats.totalAlerts}
                    color="blue"
                    subtitle="Active notifications"
                />
                <StatCard
                    title="Critical"
                    value={stats.critical}
                    color="red"
                    subtitle="Needs immediate action"
                />
                <StatCard
                    title="Warnings"
                    value={stats.warnings}
                    color="orange"
                    subtitle="Requires attention"
                />
                <StatCard
                    title="Pending Approval"
                    value={stats.pending}
                    color="purple"
                    subtitle="Awaiting vet review"
                />
            </div>

            {/* Alerts Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-xl">
                            <Bell className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <CardTitle>Operational & Predictive Alerts</CardTitle>
                            <CardDescription>Timely warnings based on your farm's data and regional forecasts.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {operationalAlerts.length > 0 ? (
                        operationalAlerts.map(alert => (
                            <Alert key={alert.id} variant={alert.severity} className="flex items-start gap-4">
                                {alert.icon}
                                <div className="flex-grow">
                                    <AlertTitle>{alert.title}</AlertTitle>
                                    <AlertDescription>{alert.description}</AlertDescription>
                                </div>
                                <Button
                                    size="sm"
                                    variant={alert.severity === 'destructive' ? 'destructive' : 'secondary'}
                                    onClick={() => handleAlertAction(alert)}
                                    className="flex-shrink-0"
                                >
                                    {alert.actionText}
                                </Button>
                            </Alert>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-emerald-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-600">No active alerts</p>
                            <p className="text-sm text-gray-500 mt-1">Your farm is compliant and all systems are running smoothly.</p>
                        </div>
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