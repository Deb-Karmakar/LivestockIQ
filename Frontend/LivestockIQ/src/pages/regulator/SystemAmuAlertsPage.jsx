// Frontend/src/pages/regulator/SystemAmuAlertsPage.jsx
// Dedicated page for system-wide AMU alerts

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '../../hooks/use-toast';
import {
    AlertTriangle, Shield, Activity, Clock, CheckCircle,
    Eye, RefreshCw, Sparkles, Bell, TrendingUp, Pill
} from 'lucide-react';
import { getSystemAmuAlerts, acknowledgeAmuAlert, updateAmuAlertStatus } from '../../services/regulatorService';
import { formatDistanceToNow } from 'date-fns';

// Alert type configuration
const ALERT_TYPE_CONFIG = {
    SYSTEM_CRITICAL_DRUG_USAGE: {
        label: 'Critical Drug Usage',
        icon: Pill,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        description: 'High usage of Watch/Reserve antibiotics across all treatments'
    },
    SYSTEM_HIGH_AMU_INTENSITY: {
        label: 'High AMU Intensity',
        icon: TrendingUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        description: 'Significant increase in antimicrobial usage across the system'
    }
};

const SEVERITY_CONFIG = {
    Critical: { color: 'bg-red-500', textColor: 'text-white' },
    High: { color: 'bg-orange-500', textColor: 'text-white' },
    Medium: { color: 'bg-yellow-500', textColor: 'text-black' },
    Low: { color: 'bg-green-500', textColor: 'text-white' }
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

// Alert Card Component
const AlertCard = ({ alert, onAcknowledge, onViewDetails }) => {
    const config = ALERT_TYPE_CONFIG[alert.alertType] || {
        label: alert.alertType,
        icon: AlertTriangle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50'
    };
    const Icon = config.icon;
    const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.Medium;

    return (
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${config.bgColor}`}>
                            <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <Badge className={`${severityConfig.color} ${severityConfig.textColor}`}>
                                    {alert.severity}
                                </Badge>
                                <Badge variant="outline">
                                    {alert.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                    {config.label}
                                </span>
                            </div>
                            <p className="font-medium text-gray-900 mb-1">{alert.message}</p>
                            <p className="text-sm text-gray-500">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {alert.status === 'New' && (
                            <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert._id)}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Acknowledge
                            </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => onViewDetails(alert)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const SystemAmuAlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({ total: 0, new: 0, acknowledged: 0, resolved: 0, critical: 0, high: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const { toast } = useToast();

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const filters = {};
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (severityFilter !== 'all') filters.severity = severityFilter;

            const data = await getSystemAmuAlerts(filters);
            setAlerts(data.alerts || []);
            setStats(data.stats || { total: 0, new: 0, acknowledged: 0, resolved: 0, critical: 0, high: 0 });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load AMU alerts' });
        } finally {
            setLoading(false);
        }
    }, [statusFilter, severityFilter, toast]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const handleAcknowledge = async (alertId) => {
        try {
            await acknowledgeAmuAlert(alertId);
            toast({ title: 'Success', description: 'Alert acknowledged' });
            fetchAlerts();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to acknowledge alert' });
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedAlert) return;
        try {
            await updateAmuAlertStatus(selectedAlert._id, status, notes);
            toast({ title: 'Success', description: 'Alert status updated' });
            setDetailsOpen(false);
            setNotes('');
            fetchAlerts();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status' });
        }
    };

    const handleViewDetails = (alert) => {
        setSelectedAlert(alert);
        setNotes(alert.notes || '');
        setDetailsOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading AMU alerts...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-300 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>AMU Monitoring</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">System AMU Alerts</h1>
                        <p className="text-blue-200 max-w-2xl">
                            Monitor antimicrobial usage trends across all registered and offline farmers.
                        </p>
                    </div>
                    <Button onClick={fetchAlerts} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Alerts" value={stats.total} icon={Bell} color="bg-blue-500" />
                <StatCard title="New Alerts" value={stats.new} icon={AlertTriangle} color="bg-orange-500" />
                <StatCard title="Critical" value={stats.critical} icon={Shield} color="bg-red-500" />
                <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="bg-green-500" />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="New">New</SelectItem>
                                    <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                                    <SelectItem value="Resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Severity</label>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Severities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts List */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Active Alerts ({alerts.length})
                </h2>

                {alerts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No Alerts</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                {statusFilter === 'all' && severityFilter === 'all'
                                    ? 'System AMU levels are within normal parameters.'
                                    : 'No alerts matching your filters.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <AlertCard
                                key={alert._id}
                                alert={alert}
                                onAcknowledge={handleAcknowledge}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Alert Details</DialogTitle>
                    </DialogHeader>
                    {selectedAlert && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Alert Type</p>
                                    <p className="font-medium">{ALERT_TYPE_CONFIG[selectedAlert.alertType]?.label || selectedAlert.alertType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Severity</p>
                                    <Badge className={`${SEVERITY_CONFIG[selectedAlert.severity]?.color} ${SEVERITY_CONFIG[selectedAlert.severity]?.textColor}`}>
                                        {selectedAlert.severity}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge variant="outline">{selectedAlert.status}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Created</p>
                                    <p className="font-medium">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Message</p>
                                <p className="p-3 bg-gray-50 rounded-lg">{selectedAlert.message}</p>
                            </div>

                            {selectedAlert.details && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Details</p>
                                    <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                                        {selectedAlert.details.breakdown && (
                                            <p><strong>Breakdown:</strong> {selectedAlert.details.breakdown}</p>
                                        )}
                                        {selectedAlert.details.criticalDrugPercentage && (
                                            <p><strong>Critical Drug Usage:</strong> {selectedAlert.details.criticalDrugPercentage}%</p>
                                        )}
                                        {selectedAlert.details.drugClassBreakdown && (
                                            <div>
                                                <strong>Drug Class Distribution:</strong>
                                                <div className="flex gap-4 mt-1">
                                                    <span className="text-green-600">Access: {selectedAlert.details.drugClassBreakdown.access}</span>
                                                    <span className="text-yellow-600">Watch: {selectedAlert.details.drugClassBreakdown.watch}</span>
                                                    <span className="text-red-600">Reserve: {selectedAlert.details.drugClassBreakdown.reserve}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Notes</p>
                                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this alert..." />
                            </div>

                            <DialogFooter className="flex gap-2">
                                {selectedAlert.status !== 'Resolved' && (
                                    <Button onClick={() => handleUpdateStatus('Resolved')} className="bg-green-600 hover:bg-green-700">
                                        Mark Resolved
                                    </Button>
                                )}
                                {selectedAlert.status === 'New' && (
                                    <Button onClick={() => handleUpdateStatus('Acknowledged')} variant="outline">
                                        Acknowledge
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SystemAmuAlertsPage;
