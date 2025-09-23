// frontend/src/pages/regulator/CompliancePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShieldX, Clock, Tractor, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/use-toast';
import { getComplianceData } from '../../services/regulatorService';

const SeverityBadge = ({ severity }) => {
    const styles = {
        High: 'bg-red-100 text-red-800',
        Medium: 'bg-amber-100 text-amber-800',
        Low: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={`${styles[severity]} hover:${styles[severity]}`}>{severity}</Badge>;
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
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!data) {
        return <div className="text-center p-8">Could not load compliance data.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Compliance Monitoring</h1>
                <p className="mt-1 text-gray-600">Track policy adherence and view non-compliance alerts across the region.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Compliance Rate</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{data.complianceStats.complianceRate}%</div>
                        <p className="text-xs text-muted-foreground">Based on all verified records</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.complianceStats.pendingVerifications}</div>
                        <p className="text-xs text-muted-foreground">Treatments awaiting vet signature</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Verifications</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{data.complianceStats.overdueVerifications}</div>
                        <p className="text-xs text-muted-foreground">Pending for over 7 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Farms Flagged</CardTitle>
                        <Tractor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{data.complianceStats.farmsFlagged}</div>
                        <p className="text-xs text-muted-foreground">With open non-compliance alerts</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <TrendingUp className="w-5 h-5" />
                             Pending Verifications Trend
                        </CardTitle>
                        <CardDescription>Number of pending treatment records in the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
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

                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldX className="w-5 h-5" />
                            Non-Compliance Alerts
                        </CardTitle>
                        <CardDescription>A list of specific flags reported by veterinarians.</CardDescription>
                    </CardHeader>
                    <CardContent>
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