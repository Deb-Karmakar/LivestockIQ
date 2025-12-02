// frontend/src/pages/regulator/AmuManagementPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Settings, TrendingUp, Activity, Shield, Bell, Save, RotateCcw, Info } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { axiosInstance } from '../../contexts/AuthContext';

// Alert Type Icons and Colors
const alertTypeConfig = {
    HISTORICAL_SPIKE: { icon: TrendingUp, color: 'orange', label: 'Historical Spike' },
    PEER_COMPARISON_SPIKE: { icon: Activity, color: 'yellow', label: 'Peer Comparison' },
    ABSOLUTE_THRESHOLD: { icon: AlertTriangle, color: 'red', label: 'Absolute Threshold' },
    TREND_INCREASE: { icon: TrendingUp, color: 'blue', label: 'Trend Increase' },
    CRITICAL_DRUG_USAGE: { icon: Shield, color: 'purple', label: 'Critical Drug Usage' },
    SUSTAINED_HIGH_USAGE: { icon: Bell, color: 'red', label: 'Sustained High Usage' }
};

// Severity Badge
const SeverityBadge = ({ severity }) => {
    const colors = {
        Low: 'bg-green-100 text-green-800 border-green-200',
        Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        High: 'bg-orange-100 text-orange-800 border-orange-200',
        Critical: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
        <Badge className={`${colors[severity]} border`}>
            {severity}
        </Badge>
    );
};

// Alert Type Badge
const AlertTypeBadge = ({ alertType }) => {
    const config = alertTypeConfig[alertType] || {};
    const Icon = config.icon || AlertTriangle;

    return (
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="text-sm">{config.label || alertType}</span>
        </div>
    );
};

const AmuManagementPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [config, setConfig] = useState(null);
    const [configForm, setConfigForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('alerts');
    const { toast } = useToast();

    // Fetch alerts
    const fetchAlerts = async () => {
        try {
            const response = await axiosInstance.get('/regulator/amu-alerts-enhanced');
            setAlerts(response.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load AMU alerts' });
        }
    };

    // Fetch configuration
    const fetchConfig = async () => {
        try {
            const response = await axiosInstance.get('/regulator/amu-config');
            setConfig(response.data);
            setConfigForm(response.data);
        } catch (error) {
            console.error('Error fetching config:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load AMU configuration' });
        }
    };

    // Initialize data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchAlerts(), fetchConfig()]);
            setLoading(false);
        };
        loadData();
    }, []);

    // Save configuration
    const handleSaveConfig = async () => {
        try {
            setSaving(true);
            const response = await axiosInstance.put('/regulator/amu-config', configForm);
            setConfig(response.data);
            toast({ title: 'Success', description: 'AMU configuration updated successfully' });
        } catch (error) {
            console.error('Error saving config:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save configuration' });
        } finally {
            setSaving(false);
        }
    };

    // Reset configuration
    const handleResetConfig = () => {
        setConfigForm(config);
        toast({ title: 'Reset', description: 'Configuration reset to last saved values' });
    };

    // Filter controls
    const [filters, setFilters] = useState({ severity: '', alertType: '', status: '' });
    const filteredAlerts = alerts.filter(alert => {
        if (filters.severity && alert.severity !== filters.severity) return false;
        if (filters.alertType && alert.alertType !== filters.alertType) return false;
        if (filters.status && alert.status !== filters.status) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading AMU management data...</p>
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
                        <Shield className="w-4 h-4" />
                        <span>Antimicrobial Usage Monitoring</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold">AMU Alerts & Configuration</h1>
                    <p className="text-blue-200 max-w-2xl">
                        Monitor antimicrobial usage alerts and configure detection thresholds. Total alerts: <span className="font-semibold text-white">{alerts.length}</span>
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600">{alerts.filter(a => a.severity === 'Critical').length}</div>
                        <div className="text-sm text-gray-500">Critical Alerts</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">{alerts.filter(a => a.severity === 'High').length}</div>
                        <div className="text-sm text-gray-500">High Severity</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600">{alerts.filter(a => a.severity === 'Medium').length}</div>
                        <div className="text-sm text-gray-500">Medium Severity</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{alerts.filter(a => a.status === 'New').length}</div>
                        <div className="text-sm text-gray-500">New Alerts</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="alerts" className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Alerts ({alerts.length})
                    </TabsTrigger>
                    <TabsTrigger value="config" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Configuration
                    </TabsTrigger>
                </TabsList>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-4">
                    {/* Filters */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Filter Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Severity</Label>
                                    <select
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={filters.severity}
                                        onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                                    >
                                        <option value="">All</option>
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Alert Type</Label>
                                    <select
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={filters.alertType}
                                        onChange={(e) => setFilters({ ...filters, alertType: e.target.value })}
                                    >
                                        <option value="">All</option>
                                        {Object.keys(alertTypeConfig).map(type => (
                                            <option key={type} value={type}>{alertTypeConfig[type].label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <select
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    >
                                        <option value="">All</option>
                                        <option value="New">New</option>
                                        <option value="Acknowledged">Acknowledged</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alerts Table */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>AMU Alerts ({filteredAlerts.length})</CardTitle>
                            <CardDescription>Real-time antimicrobial usage alerts across all farms</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Farm</TableHead>
                                            <TableHead>Alert Type</TableHead>
                                            <TableHead>Severity</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAlerts.length > 0 ? filteredAlerts.map(alert => (
                                            <TableRow key={alert._id}>
                                                <TableCell className="font-medium">
                                                    {alert.farmerId?.farmName || 'Unknown Farm'}
                                                </TableCell>
                                                <TableCell>
                                                    <AlertTypeBadge alertType={alert.alertType} />
                                                </TableCell>
                                                <TableCell>
                                                    <SeverityBadge severity={alert.severity} />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={alert.status === 'New' ? 'default' : 'secondary'}>
                                                        {alert.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {new Date(alert.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {alert.message}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan="6" className="text-center h-24 text-gray-500">
                                                    No alerts match the current filters
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Configuration Tab */}
                <TabsContent value="config" className="space-y-4">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                AMU Detection Thresholds
                            </CardTitle>
                            <CardDescription>
                                Configure sensitivity thresholds for antimicrobial usage monitoring. Changes apply immediately to future alerts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Historical Spike */}
                            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-start gap-2">
                                    <TrendingUp className="w-5 h-5 text-orange-600 mt-1" />
                                    <div className="flex-1">
                                        <Label className="text-base font-semibold">Historical Spike Threshold</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Alert when current AMU exceeds farm's 6-month average by this multiplier
                                        </p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="1"
                                                max="5"
                                                value={configForm.historicalSpikeThreshold || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, historicalSpikeThreshold: parseFloat(e.target.value) })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                (Current: {config?.historicalSpikeThreshold}x the historical average)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Peer Comparison */}
                            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-start gap-2">
                                    <Activity className="w-5 h-5 text-yellow-600 mt-1" />
                                    <div className="flex-1">
                                        <Label className="text-base font-semibold">Peer Comparison Threshold</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Alert when farm's AMU exceeds peer group average by this multiplier
                                        </p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="1"
                                                max="3"
                                                value={configForm.peerComparisonThreshold || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, peerComparisonThreshold: parseFloat(e.target.value) })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                (Current: {config?.peerComparisonThreshold}x the peer average)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Absolute Threshold */}
                            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                                    <div className="flex-1">
                                        <Label className="text-base font-semibold">Absolute Intensity Threshold</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Alert when AMU intensity exceeds this absolute limit (treatments per animal per month)
                                        </p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                max="2"
                                                value={configForm.absoluteIntensityThreshold || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, absoluteIntensityThreshold: parseFloat(e.target.value) })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                (Current: {config?.absoluteIntensityThreshold} treatments/animal/month)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trend Increase */}
                            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-start gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
                                    <div className="flex-1">
                                        <Label className="text-base font-semibold">Trend Increase Threshold (%)</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Alert when AMU shows this percentage increase over 3 months
                                        </p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <Input
                                                type="number"
                                                step="0.05"
                                                min="0.1"
                                                max="1"
                                                value={configForm.trendIncreaseThreshold || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, trendIncreaseThreshold: parseFloat(e.target.value) })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                (Current: {(config?.trendIncreaseThreshold * 100).toFixed(0)}% increase)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Critical Drug Usage */}
                            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-start gap-2">
                                    <Shield className="w-5 h-5 text-purple-600 mt-1" />
                                    <div className="flex-1">
                                        <Label className="text-base font-semibold">Critical Drug Usage Threshold (%)</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Alert when WHO Watch/Reserve antibiotics exceed this percentage of total AMU
                                        </p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <Input
                                                type="number"
                                                step="0.05"
                                                min="0.2"
                                                max="0.8"
                                                value={configForm.criticalDrugThreshold || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, criticalDrugThreshold: parseFloat(e.target.value) })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                (Current: {(config?.criticalDrugThreshold * 100).toFixed(0)}% critical drugs)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sustained High Usage */}
                            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-start gap-2">
                                    <Bell className="w-5 h-5 text-red-600 mt-1" />
                                    <div className="flex-1">
                                        <Label className="text-base font-semibold">Sustained High Usage Duration (weeks)</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Alert when high AMU persists for this many consecutive weeks
                                        </p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <Input
                                                type="number"
                                                step="1"
                                                min="2"
                                                max="12"
                                                value={configForm.sustainedHighUsageDuration || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, sustainedHighUsageDuration: parseInt(e.target.value) })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                (Current: {config?.sustainedHighUsageDuration} weeks)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Minimum Events Threshold */}
                            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-start gap-2">
                                    <Info className="w-5 h-5 text-gray-600 mt-1" />
                                    <div className="flex-1">
                                        <Label className="text-base font-semibold">Minimum Events Threshold</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Minimum number of AMU events required before triggering alerts (prevents noise)
                                        </p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <Input
                                                type="number"
                                                step="1"
                                                min="1"
                                                max="20"
                                                value={configForm.minimumEventsThreshold || ''}
                                                onChange={(e) => setConfigForm({ ...configForm, minimumEventsThreshold: parseInt(e.target.value) })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                (Current: {config?.minimumEventsThreshold} events minimum)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4 border-t">
                                <Button
                                    onClick={handleSaveConfig}
                                    disabled={saving}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save Configuration'}
                                </Button>
                                <Button
                                    onClick={handleResetConfig}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AmuManagementPage;
