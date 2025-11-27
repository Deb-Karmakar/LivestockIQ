import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats } from '../../services/adminService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users, ShieldCheck, Activity, TrendingUp, TrendingDown,
    Clock, ArrowUpRight, Sparkles, LayoutDashboard,
    FileText, Settings, AlertTriangle, CheckCircle2, Server
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// --- Components ---

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

const StatCard = ({ title, value, trend, trendValue, color, subtitle, icon: Icon }) => {
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
                <div className="flex justify-between items-start">
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
                    {Icon && (
                        <div className={`p-2 rounded-xl bg-${color}-50`}>
                            <Icon className={`w-5 h-5 text-${color}-600`} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const ActivityItem = ({ activity, isLast }) => {
    const typeConfig = {
        User: { icon: Users, color: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
        System: { icon: Server, color: 'bg-purple-100 text-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
        Alert: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-600', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    };
    const config = typeConfig[activity.type] || typeConfig.System;
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
                            {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                    </div>
                    <Badge variant="outline" className={`${config.badge} text-xs`}>
                        {activity.type}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{activity.time}</span>
                </div>
            </div>
        </div>
    );
};

const AdminDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeFarms: 0,
        totalAnimals: 0,
        pendingApprovals: 0
    });
    const [userDistribution, setUserDistribution] = useState([]);
    const [systemActivity, setSystemActivity] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data.stats);
                setUserDistribution(data.userDistribution);
                setSystemActivity(data.systemActivity);
                setRecentActivities(data.recentActivities);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
                    <div className="w-16 h-16 border-4 border-purple-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <LayoutDashboard className="w-4 h-4" />
                            <span>System Administration</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            {getGreeting()}, {user?.fullName || 'Admin'}
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            System status is <span className="text-emerald-400 font-semibold">Healthy</span>.
                            You have <span className="text-amber-400 font-semibold">{stats.pendingApprovals} pending approvals</span>.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all"
                            onClick={() => navigate('/admin/users')}
                        >
                            <Users className="mr-2 h-5 w-5" />
                            Manage Users
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-700 bg-slate-800/50"
                            onClick={() => navigate('/admin/settings')}
                        >
                            <Settings className="mr-2 h-5 w-5" />
                            Settings
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    color="blue"
                    trend="up"
                    trendValue="+5%"
                    subtitle="Across all roles"
                    icon={Users}
                />
                <StatCard
                    title="Active Farms"
                    value={stats.activeFarms}
                    color="green"
                    trend="up"
                    trendValue="+2"
                    subtitle="Producing data"
                    icon={CheckCircle2}
                />
                <StatCard
                    title="Total Animals"
                    value={stats.totalAnimals}
                    color="purple"
                    trend="up"
                    trendValue="+120"
                    subtitle="Registered livestock"
                    icon={Activity}
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    color="orange"
                    subtitle="Requires action"
                    icon={ShieldCheck}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Charts */}
                <div className="xl:col-span-2 space-y-6">
                    {/* System Activity Chart */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>System Activity</CardTitle>
                                    <CardDescription>Audit logs over the last 7 days</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={systemActivity}>
                                        <defs>
                                            <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="calls"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorCalls)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity Feed */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-xl">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <CardTitle>Recent Logs</CardTitle>
                                        <CardDescription>Latest system events</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/audits')}>
                                    View All
                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-0">
                                {recentActivities.map((activity, index) => (
                                    <ActivityItem
                                        key={activity.id}
                                        activity={activity}
                                        isLast={index === recentActivities.length - 1}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - User Distribution & Quick Actions */}
                <div className="space-y-6">
                    {/* User Distribution Chart */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-xl">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <CardTitle>User Distribution</CardTitle>
                                    <CardDescription>By role</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={userDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {userDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-4">
                                {userDistribution.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-gray-600">{item.name}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                </div>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
                                onClick={() => navigate('/admin/users')}
                            >
                                <Users className="w-5 h-5 mr-3" />
                                Approve New Users
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
                                onClick={() => navigate('/admin/audits')}
                            >
                                <ShieldCheck className="w-5 h-5 mr-3" />
                                View Audit Logs
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;