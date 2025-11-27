// frontend/src/pages/regulator/CompliancePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShieldX, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/use-toast';
import { getComplianceData } from '../../services/regulatorService';

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

const CompliancePage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const complianceData = await getComplianceData();
            setData(complianceData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load compliance data.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading compliance data...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Could not load compliance data.</p>
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
                            <span>Compliance Monitoring</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Compliance Monitoring
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Track policy adherence and view non-compliance alerts across the region. Overall compliance rate:{' '}
                            <span className="text-green-400 font-semibold">{data.complianceStats.complianceRate}%</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Compliance Rate"
                    value={`${data.complianceStats.complianceRate}%`}
                    color="green"
                    subtitle="Verified records"
                />
                <StatCard
                    title="Pending Verifications"
                    value={data.complianceStats.pendingVerifications}
                    color="blue"
                    subtitle="Awaiting vet signature"
                />
                <StatCard
                    title="Overdue Verifications"
                    value={data.complianceStats.overdueVerifications}
                    color="orange"
                    subtitle="Pending over 7 days"
                />
                <StatCard
                    title="Farms Flagged"
                    value={data.complianceStats.farmsFlagged}
                    color="red"
                    subtitle="Open alerts"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Pending Verifications Trend
                        </CardTitle>
                        <CardDescription>Number of pending treatment records in the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.complianceTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} name="Pending" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2">
                            <ShieldX className="w-5 h-5" />
                            Non-Compliance Alerts
                        </CardTitle>
                        <CardDescription>Specific flags reported by veterinarians</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Farm</TableHead>
                                    <TableHead>Issue</TableHead>
                                    <TableHead>Reporting Vet</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.alerts.length > 0 ? data.alerts.map(alert => (
                                    <TableRow key={alert.id}>
                                        <TableCell className="font-medium">{alert.farmName}</TableCell>
                                        <TableCell>{alert.issue}</TableCell>
                                        <TableCell>{alert.vetName}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan="3" className="text-center h-24">No open non-compliance alerts found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CompliancePage;