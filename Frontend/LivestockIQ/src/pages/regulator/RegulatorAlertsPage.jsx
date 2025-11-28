// Frontend/LivestockIQ/src/pages/regulator/RegulatorAlertsPage.jsx

import { useState, useEffect } from 'react';
import {
    Bell,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Clock,
    Filter,
    Download,
    Eye,
    MessageSquare,
    TrendingUp,
    Shield,
    XCircle,
    ChevronDown,
    Search,
    Zap,
    FileText,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    getAlerts,
    getAlertStats,
    getAlertById,
    acknowledgeAlert,
    updateAlertStatus,
    exportViolationReport
} from '@/services/regulatorAlertService';
import { formatDistanceToNow } from 'date-fns';

// Animated counter component
const AnimatedCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{count}</span>;
};

// Stat Card Component
const StatCard = ({ title, value, color, icon: Icon }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        red: 'from-red-500 to-red-600 shadow-red-500/25',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    };

    return (
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-[0.03]`} />
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                <AnimatedCounter value={value} />
                            </span>
                        </div>
                    </div>
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 opacity-50" />
                </div>
            </CardContent>
        </Card>
    );
};

const RegulatorAlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        severity: '',
        alertType: '',
        searchQuery: ''
    });

    // Status update form
    const [statusForm, setStatusForm] = useState({
        status: '',
        notes: '',
        actionTaken: ''
    });

    const { notifications } = useNotifications();

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [filters, pagination.page]);

    // Listen for new alerts via WebSocket
    useEffect(() => {
        const newAlerts = notifications.filter(n =>
            ['MRL_VIOLATION', 'AMU_COMPLIANCE', 'DISEASE_OUTBREAK', 'WITHDRAWAL_VIOLATION', 'BLOCKED_SALE_ATTEMPT']
                .includes(n.type)
        );

        if (newAlerts.length > 0) {
            // Refresh alerts when new notification arrives
            fetchData();
            fetchStats();

            // Play sound for critical alerts
            const criticalAlert = newAlerts.find(n => n.severity === 'critical');
            if (criticalAlert) {
                playAlertSound();
            }
        }
    }, [notifications]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getAlerts({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });

            setAlerts(data.alerts || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                pages: data.pagination?.pages || 1
            }));
        } catch (error) {
            console.error('Error fetching alerts:', error);
            toast.error('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await getAlertStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleViewDetails = async (alert) => {
        try {
            const data = await getAlertById(alert._id);
            setSelectedAlert(data.alert);
            setDetailModalOpen(true);
        } catch (error) {
            toast.error('Failed to load alert details');
        }
    };

    const handleAcknowledge = async (alertId) => {
        try {
            await acknowledgeAlert(alertId);
            toast.success('Alert acknowledged');
            fetchData();
            fetchStats();
        } catch (error) {
            toast.error('Failed to acknowledge alert');
        }
    };

    const handleOpenStatusModal = (alert) => {
        setSelectedAlert(alert);
        setStatusForm({
            status: alert.status,
            notes: '',
            actionTaken: ''
        });
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await updateAlertStatus(
                selectedAlert._id,
                statusForm.status,
                statusForm.notes,
                statusForm.actionTaken
            );
            toast.success(`Alert marked as ${statusForm.status}`);
            setStatusModalOpen(false);
            fetchData();
            fetchStats();
        } catch (error) {
            toast.error('Failed to update alert status');
        }
    };

    const handleExport = async () => {
        try {
            await exportViolationReport({ format: 'csv' });
            toast.success('Report downloaded');
        } catch (error) {
            toast.error('Failed to export report');
        }
    };

    const playAlertSound = () => {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGB0fPTgjMGHm7A7+OZXRA=');
        audio.play().catch(() => { }); // Ignore errors
    };

    const getSeverityBadge = (severity) => {
        const config = {
            CRITICAL: { color: 'bg-red-500', icon: AlertTriangle },
            HIGH: { color: 'bg-orange-500', icon: AlertCircle },
            MEDIUM: { color: 'bg-yellow-500', icon: Bell },
            LOW: { color: 'bg-blue-500', icon: Bell }
        };
        const { color, icon: Icon } = config[severity] || config.LOW;
        return (
            <Badge className={`${color} hover:${color} text-white`}>
                <Icon className="w-3 h-3 mr-1" />
                {severity}
            </Badge>
        );
    };

    const getStatusBadge = (status) => {
        const config = {
            NEW: { color: 'bg-blue-500', text: 'New' },
            ACKNOWLEDGED: { color: 'bg-purple-500', text: 'Acknowledged' },
            INVESTIGATING: { color: 'bg-yellow-500', text: 'Investigating' },
            RESOLVED: { color: 'bg-green-500', text: 'Resolved' },
            ESCALATED: { color: 'bg-red-600', text: 'Escalated' }
        };
        const { color, text } = config[status] || config.NEW;
        return (
            <Badge className={`${color} hover:${color} text-white`}>
                {text}
            </Badge>
        );
    };

    const getAlertTypeIcon = (type) => {
        const icons = {
            MRL_VIOLATION: AlertTriangle,
            AMU_COMPLIANCE: Shield,
            DISEASE_OUTBREAK: AlertCircle,
            WITHDRAWAL_VIOLATION: Clock,
            BLOCKED_SALE_ATTEMPT: XCircle
        };
        return icons[type] || Bell;
    };

    if (loading && alerts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-red-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading alerts...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Alert Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Regulator Alerts Dashboard
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Real-time monitoring of MRL violations, compliance issues, and safety alerts. You have{' '}
                            <span className="text-red-400 font-semibold">{stats?.summary?.criticalAlerts || 0} critical alerts</span> requiring attention.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        {/* WebSocket Status */}

                        <Button
                            onClick={handleExport}
                            size="lg"
                            className="w-full sm:w-auto bg-white text-red-600 hover:bg-red-50 shadow-lg shadow-white/25"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Total Alerts"
                    value={stats?.summary?.totalAlerts || 0}
                    color="blue"
                    icon={Bell}
                />
                <StatCard
                    title="Critical Alerts"
                    value={stats?.summary?.criticalAlerts || 0}
                    color="red"
                    icon={AlertTriangle}
                />
                <StatCard
                    title="Pending Review"
                    value={stats?.summary?.newAlerts || 0}
                    color="orange"
                    icon={Clock}
                />
                <StatCard
                    title="MRL Violations (30d)"
                    value={stats?.summary?.recentViolations || 0}
                    color="purple"
                    icon={TrendingUp}
                />
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        <CardTitle>Filter Alerts</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <Label>Alert Type</Label>
                            <Select
                                value={filters.alertType}
                                onValueChange={(value) => setFilters({ ...filters, alertType: value === 'all' ? '' : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="MRL_VIOLATION">MRL Violation</SelectItem>
                                    <SelectItem value="AMU_COMPLIANCE">AMU Compliance</SelectItem>
                                    <SelectItem value="DISEASE_OUTBREAK">Disease Outbreak</SelectItem>
                                    <SelectItem value="WITHDRAWAL_VIOLATION">Withdrawal Violation</SelectItem>
                                    <SelectItem value="BLOCKED_SALE_ATTEMPT">Blocked Sale</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Severity</Label>
                            <Select
                                value={filters.severity}
                                onValueChange={(value) => setFilters({ ...filters, severity: value === 'all' ? '' : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Severities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="LOW">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Status</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="NEW">New</SelectItem>
                                    <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                                    <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    <SelectItem value="ESCALATED">Escalated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Search Farm</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Farm ID or Name"
                                    value={filters.searchQuery}
                                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alert Feed */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Active Alerts ({alerts.length})</CardTitle>
                            <CardDescription>Real-time feed of compliance violations and safety alerts</CardDescription>
                        </div>

                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    {alerts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900">No Alerts Found</p>
                            <p className="text-gray-600">All farms are compliant with current filters</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert) => {
                                const TypeIcon = getAlertTypeIcon(alert.alertType);
                                return (
                                    <div
                                        key={alert._id}
                                        className="border rounded-xl p-4 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`p-2 rounded-lg flex-shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-red-100' :
                                                    alert.severity === 'HIGH' ? 'bg-orange-100' :
                                                        alert.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-blue-100'
                                                    }`}>
                                                    <TypeIcon className={`w-5 h-5 ${alert.severity === 'CRITICAL' ? 'text-red-600' :
                                                        alert.severity === 'HIGH' ? 'text-orange-600' :
                                                            alert.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                                                        }`} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        {getSeverityBadge(alert.severity)}
                                                        {getStatusBadge(alert.status)}
                                                        <Badge variant="outline" className="truncate">
                                                            {alert.alertType.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </div>

                                                    <h3 className="font-semibold text-gray-900 mb-1 break-words">
                                                        {alert.message}
                                                    </h3>

                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <p className="truncate">
                                                            <span className="font-medium">Farm:</span>{' '}
                                                            {alert.farmName || alert.farmerId?.farmName || 'Unknown Farm'}
                                                            {alert.farmLocation && ` • ${alert.farmLocation}`}
                                                        </p>
                                                        {alert.violationDetails && (
                                                            <p className="text-xs truncate">
                                                                {alert.violationDetails.animalId && `Animal: ${alert.violationDetails.animalId} • `}
                                                                {alert.violationDetails.drugName && `Drug: ${alert.violationDetails.drugName}`}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row lg:flex-col items-center gap-2 w-full lg:w-auto">
                                                {alert.status === 'NEW' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleAcknowledge(alert._id)}
                                                        className="flex-1 lg:flex-none lg:w-full"
                                                    >
                                                        <CheckCircle className="w-4 h-4 sm:mr-1" />
                                                        <span className="hidden sm:inline">Acknowledge</span>
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewDetails(alert)}
                                                    className="flex-1 lg:flex-none lg:w-full"
                                                >
                                                    <Eye className="w-4 h-4 sm:mr-1" />
                                                    <span className="hidden sm:inline">Details</span>
                                                </Button>
                                                {alert.status !== 'RESOLVED' && (
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 lg:flex-none lg:w-full bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => handleOpenStatusModal(alert)}
                                                    >
                                                        <MessageSquare className="w-4 h-4 sm:mr-1" />
                                                        <span className="hidden sm:inline">Update</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                                    <div className="text-sm text-gray-600">
                                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} alerts
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === 1}
                                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === pagination.pages}
                                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Alert Detail Modal */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Alert Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this alert
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAlert && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                {getSeverityBadge(selectedAlert.severity)}
                                {getStatusBadge(selectedAlert.status)}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-600">Alert Type</h4>
                                    <p className="text-gray-900">{selectedAlert.alertType.replace(/_/g, ' ')}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-gray-600">Message</h4>
                                    <p className="text-gray-900">{selectedAlert.message}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-gray-600">Farm Information</h4>
                                    <p className="text-gray-900">
                                        {selectedAlert.farmName || selectedAlert.farmerId?.farmName || 'Unknown Farm'}
                                    </p>
                                    {selectedAlert.farmerId && typeof selectedAlert.farmerId === 'object' && (
                                        <div className="text-sm text-gray-600 mt-1">
                                            {selectedAlert.farmerId.farmOwner && <p>Owner: {selectedAlert.farmerId.farmOwner}</p>}
                                            {selectedAlert.farmerId.phoneNumber && <p>Contact: {selectedAlert.farmerId.phoneNumber}</p>}
                                            {selectedAlert.farmerId.email && <p>Email: {selectedAlert.farmerId.email}</p>}
                                            {selectedAlert.farmerId.location && (
                                                <p>
                                                    Location: {
                                                        typeof selectedAlert.farmerId.location === 'string'
                                                            ? selectedAlert.farmerId.location
                                                            : selectedAlert.farmerId.location.latitude && selectedAlert.farmerId.location.longitude
                                                                ? `${selectedAlert.farmerId.location.latitude.toFixed(4)}, ${selectedAlert.farmerId.location.longitude.toFixed(4)}`
                                                                : 'Unknown'
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {selectedAlert.farmLocation && (
                                        <p className="text-sm text-gray-600 mt-1">Location: {selectedAlert.farmLocation}</p>
                                    )}
                                </div>

                                {selectedAlert.violationDetails && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-600">Violation Details</h4>
                                        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                                            {Object.entries(selectedAlert.violationDetails).map(([key, value]) => {
                                                // Skip labTestId if it's an object (populated)
                                                if (key === 'labTestId' && typeof value === 'object') return null;
                                                return (
                                                    <p key={key}>
                                                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {(selectedAlert.violationDetails?.labTestId?.certificateUrl || selectedAlert.violationDetails?.certificateUrl) && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-600">Lab Report</h4>
                                        <a
                                            href={selectedAlert.violationDetails?.labTestId?.certificateUrl || selectedAlert.violationDetails?.certificateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-1"
                                        >
                                            <FileText className="w-4 h-4" />
                                            View Lab Certificate
                                        </a>
                                    </div>
                                )}

                                {selectedAlert.investigationNotes && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-600">Investigation Notes</h4>
                                        <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded">
                                            {selectedAlert.investigationNotes}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <h4 className="font-semibold text-gray-600">Created</h4>
                                        <p className="text-gray-900">
                                            {new Date(selectedAlert.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {selectedAlert.acknowledgedAt && (
                                        <div>
                                            <h4 className="font-semibold text-gray-600">Acknowledged</h4>
                                            <p className="text-gray-900">
                                                {new Date(selectedAlert.acknowledgedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {selectedAlert.resolvedAt && (
                                        <div>
                                            <h4 className="font-semibold text-gray-600">Resolved</h4>
                                            <p className="text-gray-900">
                                                {new Date(selectedAlert.resolvedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Update Modal */}
            <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Alert Status</DialogTitle>
                        <DialogDescription>
                            Update the status and add notes about actions taken
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateStatus}>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={statusForm.status}
                                    onValueChange={(value) => setStatusForm({ ...statusForm, status: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New</SelectItem>
                                        <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                                        <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                        <SelectItem value="ESCALATED">Escalated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Action Taken</Label>
                                <Input
                                    placeholder="Brief description of action"
                                    value={statusForm.actionTaken}
                                    onChange={(e) => setStatusForm({ ...statusForm, actionTaken: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Notes</Label>
                                <textarea
                                    className="w-full border rounded-md p-2 min-h-[100px]"
                                    placeholder="Add investigation notes or resolution details..."
                                    value={statusForm.notes}
                                    onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setStatusModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                Update Status
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default RegulatorAlertsPage;
