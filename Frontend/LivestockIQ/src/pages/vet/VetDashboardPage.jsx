// frontend/src/pages/vet/VetDashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, Users, ShieldAlert, CheckCircle2, Copy, Share2, Sparkles, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getVetDashboardData } from '../../services/vetService';

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

const VetDashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const dashboardData = await getVetDashboardData();
            setData(dashboardData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load dashboard data.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCopyToClipboard = () => {
        if (user?.vetId) {
            navigator.clipboard.writeText(user.vetId);
            toast({ title: "Copied!", description: `Your Vet ID (${user.vetId}) is copied to the clipboard.` });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading dashboard...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Could not load dashboard data.</p>
            </div>
        );
    }

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
                            <span>Veterinary Dashboard</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Welcome, {user?.fullName || 'Doctor'}!
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Here's a summary of your key tasks and farm compliance. You have{' '}
                            <span className="text-orange-400 font-semibold">{data.stats.pendingReviewCount} pending reviews</span> from{' '}
                            <span className="text-blue-400 font-semibold">{data.stats.assignedFarmersCount} assigned farmers</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Vet ID Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="border-b bg-white/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Share2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Your Unique Vet ID</CardTitle>
                                <CardDescription>Share this code with farmers so they can register under your supervision</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <p className="text-2xl md:text-3xl font-mono font-bold text-blue-800 tracking-widest bg-white p-4 rounded-lg flex-grow text-center sm:text-left shadow-sm">
                            {user?.vetId || 'Loading...'}
                        </p>
                        <Button onClick={handleCopyToClipboard} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            <Copy className="mr-2 h-4 w-4" /> Copy ID
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                <StatCard
                    title="Pending Reviews"
                    value={data.stats.pendingReviewCount}
                    color="orange"
                    subtitle="Awaiting approval"
                />
                <StatCard
                    title="Active Alerts"
                    value={data.stats.activeFarmAlertsCount}
                    color="red"
                    subtitle="Farm compliance issues"
                />
                <StatCard
                    title="Assigned Farmers"
                    value={data.stats.assignedFarmersCount}
                    color="blue"
                    subtitle="Under supervision"
                />
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* High Priority Reviews */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-xl">
                                <ClipboardList className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <CardTitle>High-Priority Reviews</CardTitle>
                                <CardDescription>Recent treatments requiring your attention</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Farmer</TableHead>
                                    <TableHead>Animal ID</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.highPriorityRequests.length > 0 ? data.highPriorityRequests.map((req) => (
                                    <TableRow key={req._id}>
                                        <TableCell className="font-medium">{req.farmerId.farmOwner}</TableCell>
                                        <TableCell>{req.animalId}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => navigate('/vet/requests')}>Review</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan="3" className="text-center h-24">
                                            <div className="flex flex-col items-center gap-2">
                                                <CheckCircle2 className="h-12 w-12 text-gray-400" />
                                                <p className="text-gray-600">No pending requests</p>
                                                <p className="text-sm text-gray-500">All caught up!</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Compliance Card */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-xl">
                                <Stethoscope className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Overall Farm Compliance</CardTitle>
                                <CardDescription>Approval rate across all your assigned farms</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-4xl font-bold text-green-600">{data.complianceRate}%</span>
                            <CheckCircle2 className="w-12 h-12 text-green-200" />
                        </div>
                        <Progress value={data.complianceRate} className="w-full" />
                        <p className="text-xs text-gray-500">
                            Based on the percentage of treatment records you have approved.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VetDashboardPage;