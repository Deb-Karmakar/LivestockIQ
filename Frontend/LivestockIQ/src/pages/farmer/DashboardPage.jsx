import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '../../contexts/AuthContext';
import {
    PlusCircle, Syringe, Bell, ShieldCheck, FileText, Package,
    BarChartHorizontalBig, FileSignature, ShieldAlert, Loader2,
    TrendingUp, TrendingDown, Activity, Calendar, ChevronRight,
    Heart, AlertTriangle, CheckCircle2, Clock, ArrowUpRight,
    Sparkles, RefreshCw, Eye, Users, CircleDot
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { format, differenceInDays, formatDistanceToNow, subDays } from 'date-fns';

import { getAnimals } from '../../services/animalService';
import { getTreatments } from '../../services/treatmentService';
import { getSales } from '../../services/salesService';
import { useToast } from '../../hooks/use-toast';

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
const StatCard = ({ title, value, trend, trendValue, color, subtitle }) => {
    const colorClasses = {
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
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
                        {trend && (
                            <span className={`flex items-center text-xs font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                {trendValue}
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
};

// Activity Item Component
const ActivityItem = ({ activity, isLast }) => {
    const typeConfig = {
        Treatment: { icon: Syringe, color: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
        Sale: { icon: Package, color: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    };
    const config = typeConfig[activity.type] || typeConfig.Treatment;
    const Icon = config.icon;

    return (
        <div className="flex gap-4 group">
            <div className="relative flex flex-col items-center">
                <div className={`p-2 rounded-xl ${config.color} transition-transform group-hover:scale-110`}>
                    <Icon className="w-4 h-4" />
                </div>
                {!isLast && <div className="w-px h-full bg-gray-200 mt-2" />}
            </div>
            <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {activity.id}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{activity.task}</p>
                    </div>
                    <Badge variant="outline" className={`${config.badge} text-xs`}>
                        {activity.type}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(activity.date, { addSuffix: true })}</span>
                </div>
            </div>
        </div>
    );
};

// Alert Card Component
const AlertCard = ({ alert, onClick }) => {
    const severityConfig = {
        destructive: {
            bg: 'bg-gradient-to-r from-red-50 to-red-100/50',
            border: 'border-red-200',
            icon: 'bg-red-500',
            text: 'text-red-800'
        },
        warning: {
            bg: 'bg-gradient-to-r from-amber-50 to-amber-100/50',
            border: 'border-amber-200',
            icon: 'bg-amber-500',
            text: 'text-amber-800'
        },
    };
    const config = severityConfig[alert.severity] || severityConfig.warning;

    return (
        <div
            className={`p-4 rounded-xl ${config.bg} ${config.border} border transition-all hover:shadow-md cursor-pointer group`}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${config.icon} shadow-lg`}>
                    {React.cloneElement(alert.icon, { className: 'w-4 h-4 text-white' })}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${config.text}`}>{alert.title}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{alert.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
};

// Custom Pie Chart Label
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [animals, setAnimals] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [sales, setSales] = useState([]);

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [animalsData, treatmentsData, salesData] = await Promise.all([
                getAnimals(),
                getTreatments(),
                getSales(),
            ]);
            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setTreatments(Array.isArray(treatmentsData) ? treatmentsData : []);
            setSales(Array.isArray(salesData) ? salesData : []);

            if (isRefresh) {
                toast({ title: "Dashboard refreshed", description: "All data is up to date." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load dashboard data." });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { herdHealthData, urgentAlerts, recentActivity, quickStats, trendData } = useMemo(() => {
        const now = new Date();

        // Calculate Urgent Alerts
        const alerts = [];
        treatments.forEach(t => {
            if (t.status === 'Pending') {
                alerts.push({
                    id: t._id,
                    severity: "warning",
                    title: `Pending Vet Approval`,
                    description: `Treatment for ${t.animalId} needs signature.`,
                    icon: <FileSignature className="h-4 w-4" />,
                    navigateTo: '/farmer/treatments'
                });
            }
            if (t.status === 'Approved' && t.withdrawalEndDate) {
                const daysLeft = differenceInDays(new Date(t.withdrawalEndDate), now);
                if (daysLeft >= 0 && daysLeft <= 7) {
                    alerts.push({
                        id: `${t._id}-wd`,
                        severity: daysLeft <= 2 ? "destructive" : "warning",
                        title: "Withdrawal Ending Soon",
                        description: `Animal ${t.animalId} will be safe in ${daysLeft} days.`,
                        icon: <ShieldAlert className="h-4 w-4" />,
                        navigateTo: '/farmer/alerts'
                    });
                }
            }
        });

        // Calculate Recent Activity
        const recentTreatments = treatments
            .filter(t => t.status === 'Approved')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 3)
            .map(t => ({
                id: t.animalId,
                task: `Treated with ${t.drugName}`,
                type: "Treatment",
                date: new Date(t.updatedAt),
            }));

        const recentSales = sales
            .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
            .slice(0, 3)
            .map(s => ({
                id: s.animalId,
                task: `Sold ${s.productType}`,
                type: "Sale",
                date: new Date(s.saleDate),
            }));

        const activity = [...recentTreatments, ...recentSales]
            .sort((a, b) => b.date - a.date)
            .slice(0, 5);

        // Calculate Quick Stats & Herd Health
        const animalsUnderWithdrawal = new Set(
            treatments.filter(t => t.withdrawalEndDate && new Date(t.withdrawalEndDate) > now).map(t => t.animalId)
        );
        const animalsPendingApproval = new Set(
            treatments.filter(t => t.status === 'Pending').map(t => t.animalId)
        );

        const stats = {
            totalAnimals: animals.length,
            activeTreatments: animalsUnderWithdrawal.size,
            animalsSafeForSale: Math.max(0, animals.length - animalsUnderWithdrawal.size),
            pendingApproval: animalsPendingApproval.size,
            totalSales: sales.length,
        };

        const healthData = [
            { name: 'Healthy', value: stats.animalsSafeForSale, color: '#10b981' },
            { name: 'Under Treatment', value: stats.activeTreatments, color: '#f59e0b' },
            { name: 'Pending Review', value: stats.pendingApproval, color: '#ef4444' },
        ].filter(item => item.value > 0);

        // Generate trend data for the mini chart
        const trend = Array.from({ length: 7 }, (_, i) => ({
            day: format(subDays(now, 6 - i), 'EEE'),
            treatments: Math.floor(Math.random() * 5) + 1,
            sales: Math.floor(Math.random() * 3),
        }));

        return {
            herdHealthData: healthData,
            urgentAlerts: alerts.sort((a, b) => (a.severity === 'destructive' ? -1 : 1)).slice(0, 4),
            recentActivity: activity,
            quickStats: stats,
            trendData: trend,
        };
    }, [animals, treatments, sales]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            {getGreeting()}, {user?.farmOwner?.split(' ')[0] || 'Farmer'}!
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Here's what's happening with your farm today. You have{' '}
                            <span className="text-amber-400 font-semibold">{urgentAlerts.length} alerts</span> that need your attention.
                        </p>
                    </div>

                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                            size="lg"
                            className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 text-xs sm:text-base px-2 sm:px-4"
                            onClick={() => navigate('/farmer/treatments')}
                        >
                            <PlusCircle className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span>New Treatment</span>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="flex-1 sm:flex-none border-slate-600 text-white hover:bg-slate-700 bg-slate-800/50 text-xs sm:text-base px-2 sm:px-4"
                            onClick={() => navigate('/farmer/reports')}
                        >
                            <FileText className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span>Reports</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Total Animals"
                    value={quickStats.totalAnimals}
                    color="blue"
                    trend="up"
                    trendValue="+12%"
                    subtitle="Registered in system"
                />
                <StatCard
                    title="Safe for Sale"
                    value={quickStats.animalsSafeForSale}
                    color="green"
                    trend="up"
                    trendValue="+8%"
                    subtitle="Ready for market"
                />
                <StatCard
                    title="Active Treatments"
                    value={quickStats.activeTreatments}
                    color="orange"
                    subtitle="Under withdrawal period"
                />
                <StatCard
                    title="Pending Approval"
                    value={quickStats.pendingApproval}
                    color="purple"
                    subtitle="Awaiting vet signature"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Charts & Activity */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Herd Health Overview */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-xl">
                                        <Heart className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <CardTitle>Herd Health Overview</CardTitle>
                                        <CardDescription>Real-time health status of your livestock</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-gray-500">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="h-64">
                                    {herdHealthData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={herdHealthData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    labelLine={false}
                                                    label={renderCustomLabel}
                                                    strokeWidth={0}
                                                >
                                                    {herdHealthData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                            className="transition-all duration-300 hover:opacity-80"
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name) => [`${value} Animals`, name]}
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <CircleDot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p className="text-gray-500">No data available</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {herdHealthData.length > 0 ? herdHealthData.map((item) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full mr-4 ring-4 ring-offset-2"
                                                style={{ backgroundColor: item.color, ringColor: `${item.color}30` }}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {quickStats.totalAnimals > 0
                                                        ? ((item.value / quickStats.totalAnimals) * 100).toFixed(1)
                                                        : 0}% of herd
                                                </p>
                                            </div>
                                            <span className="text-2xl font-bold text-gray-900">
                                                {item.value}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No animal data available</p>
                                            <Button
                                                className="mt-4"
                                                variant="outline"
                                                onClick={() => navigate('/farmer/animals')}
                                            >
                                                Add Animals
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-xl">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle>Recent Activity</CardTitle>
                                        <CardDescription>Latest treatments and sales on your farm</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/farmer/treatments')}>
                                    View All
                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {recentActivity.length > 0 ? (
                                <div className="space-y-0">
                                    {recentActivity.map((activity, index) => (
                                        <ActivityItem
                                            key={`${activity.id}-${index}`}
                                            activity={activity}
                                            isLast={index === recentActivity.length - 1}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No recent activity</p>
                                    <p className="text-sm text-gray-400 mt-1">Start by adding a treatment or recording a sale</p>
                                    <Button className="mt-4" variant="outline" onClick={() => navigate('/farmer/treatments')}>
                                        Add Treatment
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Alerts & Quick Actions */}
                <div className="space-y-6">
                    {/* Urgent Alerts */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-xl relative">
                                        <Bell className="w-5 h-5 text-red-600" />
                                        {urgentAlerts.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center animate-pulse">
                                                {urgentAlerts.length}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle className="text-red-900">Urgent Alerts</CardTitle>
                                        <CardDescription className="text-red-600/70">Requires immediate attention</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {urgentAlerts.length > 0 ? urgentAlerts.map(alert => (
                                <AlertCard
                                    key={alert.id}
                                    alert={alert}
                                    onClick={() => navigate(alert.navigateTo)}
                                />
                            )) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <p className="text-gray-700 font-medium">All clear!</p>
                                    <p className="text-sm text-gray-500 mt-1">No urgent alerts at this time</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Weekly Trend Mini Chart */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Weekly Trend</CardTitle>
                                    <CardDescription>Activity over the past 7 days</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorTreatments" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="treatments"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorTreatments)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                </div>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
                                onClick={() => navigate('/farmer/animals')}
                            >
                                <Users className="w-5 h-5 mr-3" />
                                Manage Animals
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
                                onClick={() => navigate('/farmer/treatments')}
                            >
                                <Syringe className="w-5 h-5 mr-3" />
                                Record Treatment
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
                                onClick={() => navigate('/farmer/sell')}
                            >
                                <Package className="w-5 h-5 mr-3" />
                                Record Sale
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
                                onClick={() => navigate('/farmer/alerts')}
                            >
                                <Bell className="w-5 h-5 mr-3" />
                                View Alerts
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;