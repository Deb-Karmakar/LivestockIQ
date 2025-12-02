// Frontend/src/pages/farmer/AlertsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TrendingUp, Activity, AlertTriangle, Shield, Bell, Eye,
    ChevronRight, Sparkles, AlertCircle, FileSignature, ShieldAlert
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getTreatments } from '../../services/treatmentService';
import { getMyHighAmuAlerts } from '../../services/farmerService';

// Alert Type Configuration
const AMU_ALERT_CONFIG = {
    HISTORICAL_SPIKE: {
        icon: TrendingUp,
        color: 'orange',
        label: 'Historical Spike',
        description: 'Higher than your farm average'
    },
    PEER_COMPARISON_SPIKE: {
        icon: Activity,
        color: 'yellow',
        label: 'Peer Comparison',
        description: 'Higher than similar farms'
    },
    ABSOLUTE_THRESHOLD: {
        icon: AlertTriangle,
        color: 'red',
        label: 'Absolute Limit',
        description: 'Exceeds recommended limit'
    },
    TREND_INCREASE: {
        icon: TrendingUp,
        color: 'blue',
        label: 'Upward Trend',
        description: 'Increasing over time'
    },
    CRITICAL_DRUG_USAGE: {
        icon: Shield,
        color: 'purple',
        label: 'Critical Drugs',
        description: 'Overusing important antibiotics'
    },
    SUSTAINED_HIGH_USAGE: {
        icon: Bell,
        color: 'red',
        label: 'Sustained High Use',
        description: 'Persistent high usage'
    }
};

// Severity Badge Component
const SeverityBadge = ({ severity }) => {
    const config = {
        Low: 'bg-green-100 text-green-800 border-green-200',
        Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        High: 'bg-orange-100 text-orange-800 border-orange-200',
        Critical: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
        <Badge className={`${config[severity]} border font-semibold`}>
            {severity}
        </Badge>
    );
};

// AMU Alert Card Component
const AmuAlertCard = ({ alert, onClick }) => {
    const alertConfig = AMU_ALERT_CONFIG[alert.alertType] || {};
    const Icon = alertConfig.icon || AlertCircle;

    const iconColorClass = `text-${alertConfig.color}-600`;
    const bgColorClass = `bg-${alertConfig.color}-100`;

    return (
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all cursor-pointer" onClick={onClick}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${bgColorClass}`}>
                            <Icon className={`w-6 h-6 ${iconColorClass}`} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{alertConfig.label}</h3>
                                <SeverityBadge severity={alert.severity} />

                            </div>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                            <p className="text-xs text-gray-500">{alertConfig.description}</p>

                            {/* Drug Class Breakdown */}
                            {alert.details?.drugClassBreakdown && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Drug Class Breakdown:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span>Access: {alert.details.drugClassBreakdown.access || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            <span>Watch: {alert.details.drugClassBreakdown.watch || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <span>Reserve: {alert.details.drugClassBreakdown.reserve || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                            <span>Other: {alert.details.drugClassBreakdown.unclassified || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-400 mt-2">
                                {new Date(alert.createdAt).toLocaleDateString()} at {new Date(alert.createdAt).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
        red: 'bg-gradient-to-br from-red-500 to-red-600',
        orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
        blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
        green: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    };

    return (
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const AlertsPage = () => {
    const [treatments, setTreatments] = useState([]);
    const [amuAlerts, setAmuAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('amu');
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [treatmentsData, amuData] = await Promise.all([
                getTreatments(),
                getMyHighAmuAlerts()
            ]);
            setTreatments(treatmentsData || []);
            setAmuAlerts(amuData || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load alerts' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate operational alerts
    const withdrawalAlerts = treatments.filter(t => {
        if (t.status === 'Approved' && t.withdrawalEndDate) {
            const daysLeft = differenceInDays(new Date(t.withdrawalEndDate), new Date());
            return daysLeft >= 0 && daysLeft <= 7;
        }
        return false;
    });

    const pendingTreatments = treatments.filter(t => t.status === 'Pending');

    // Calculate stats
    const stats = {
        totalAmuAlerts: amuAlerts.length,
        criticalAmu: amuAlerts.filter(a => a.severity === 'Critical' || a.severity === 'High').length,
        pendingApprovals: pendingTreatments.length,
        withdrawalEnding: withdrawalAlerts.length
    };

    const handleAmuAlertClick = (alert) => {
        toast({
            title: AMU_ALERT_CONFIG[alert.alertType]?.label || 'AMU Alert',
            description: alert.message,
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading alerts...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative space-y-2">
                    <div className="flex items-center gap-2 text-blue-300 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        <span>Alert Center</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold">Alerts & Notifications</h1>
                    <p className="text-blue-200 max-w-2xl">
                        Monitor your farm's antimicrobial usage and compliance status.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="AMU Alerts"
                    value={stats.totalAmuAlerts}
                    icon={AlertCircle}
                    color="red"
                />
                <StatCard
                    title="Critical"
                    value={stats.criticalAmu}
                    icon={AlertTriangle}
                    color="orange"
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon={FileSignature}
                    color="blue"
                />
                <StatCard
                    title="Withdrawal Ending"
                    value={stats.withdrawalEnding}
                    icon={ShieldAlert}
                    color="green"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 max-w-xl">
                    <TabsTrigger value="amu">
                        AMU Alerts ({stats.totalAmuAlerts})
                    </TabsTrigger>
                    <TabsTrigger value="operational">
                        Operational ({stats.pendingApprovals + stats.withdrawalEnding})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                        All
                    </TabsTrigger>
                </TabsList>

                {/* AMU Alerts Tab */}
                <TabsContent value="amu" className="space-y-4 mt-6">
                    {amuAlerts.length > 0 ? (
                        <div className="space-y-4">
                            {amuAlerts.map(alert => (
                                <AmuAlertCard
                                    key={alert._id}
                                    alert={alert}
                                    onClick={() => handleAmuAlertClick(alert)}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No AMU Alerts</h3>
                                <p className="text-sm text-gray-500 mt-2">Your antimicrobial usage is within normal ranges</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Operational Alerts Tab */}
                <TabsContent value="operational" className="space-y-4 mt-6">
                    <div className="space-y-4">
                        {/* Pending Approvals */}
                        {pendingTreatments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileSignature className="w-5 h-5" />
                                        Pending Vet Approvals ({pendingTreatments.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {pendingTreatments.map(treatment => (
                                        <div key={treatment._id} className="p-4 border rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Animal {treatment.animalId}</p>
                                                <p className="text-sm text-gray-600">Drug: {treatment.drugName}</p>
                                            </div>
                                            <Button size="sm" onClick={() => navigate('/farmer/treatments')}>
                                                View
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Withdrawal Ending */}
                        {withdrawalAlerts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5" />
                                        Withdrawal Periods Ending ({withdrawalAlerts.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {withdrawalAlerts.map(treatment => {
                                        const daysLeft = differenceInDays(new Date(treatment.withdrawalEndDate), new Date());
                                        return (
                                            <div key={treatment._id} className="p-4 border rounded-lg flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Animal {treatment.animalId}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                                                    </p>
                                                </div>
                                                <Badge variant={daysLeft <= 2 ? 'destructive' : 'secondary'}>
                                                    {daysLeft <= 2 ? 'Critical' : 'Warning'}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {pendingTreatments.length === 0 && withdrawalAlerts.length === 0 && (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Shield className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">All Clear</h3>
                                    <p className="text-sm text-gray-500 mt-2">No pending operational tasks</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* All Tab */}
                <TabsContent value="all" className="space-y-6 mt-6">
                    {/* AMU Alerts */}
                    {amuAlerts.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">AMU Alerts</h2>
                            <div className="space-y-4">
                                {amuAlerts.map(alert => (
                                    <AmuAlertCard
                                        key={alert._id}
                                        alert={alert}
                                        onClick={() => handleAmuAlertClick(alert)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Operational */}
                    {(pendingTreatments.length > 0 || withdrawalAlerts.length > 0) && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Operational</h2>
                            <p className="text-sm text-gray-600 mb-2">
                                {pendingTreatments.length} pending approvals, {withdrawalAlerts.length} withdrawal periods ending soon
                            </p>
                        </div>
                    )}

                    {amuAlerts.length === 0 && pendingTreatments.length === 0 && withdrawalAlerts.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">All Clear!</h3>
                                <p className="text-sm text-gray-500 mt-2">No active alerts. Your farm is running smoothly.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AlertsPage;