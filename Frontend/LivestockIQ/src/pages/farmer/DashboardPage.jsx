import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircle, Syringe, Bell, ShieldCheck, FileText, Package, BarChartHorizontalBig, FileSignature, ShieldAlert, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, differenceInDays, formatDistanceToNow } from 'date-fns';

// NEW: Import all necessary services
import { getAnimals } from '../../services/animalService';
import { getTreatments } from '../../services/treatmentService';
import { getSales } from '../../services/salesService';
import { useToast } from '../../hooks/use-toast';


// --- Dashboard Component ---

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // NEW: State for loading and holding live data
    const [loading, setLoading] = useState(true);
    const [animals, setAnimals] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [sales, setSales] = useState([]);

    // NEW: Fetch all required data in one go
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [animalsData, treatmentsData, salesData] = await Promise.all([
                getAnimals(),
                getTreatments(),
                getSales(),
            ]);
            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setTreatments(Array.isArray(treatmentsData) ? treatmentsData : []);
            setSales(Array.isArray(salesData) ? salesData : []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load dashboard data." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // NEW: Calculate all dashboard metrics from the live data
    const { herdHealthData, urgentAlerts, recentActivity, quickStats } = useMemo(() => {
        const now = new Date();
        
        // 1. Calculate Urgent Alerts
        const alerts = [];
        treatments.forEach(t => {
            if (t.status === 'Pending') {
                alerts.push({ id: t._id, severity: "warning", title: `Pending Vet Approval`, description: `Treatment for ${t.animalId} needs signature.`, icon: <FileSignature className="h-4 w-4" /> });
            }
            if (t.status === 'Approved' && t.withdrawalEndDate) {
                const daysLeft = differenceInDays(new Date(t.withdrawalEndDate), now);
                if (daysLeft >= 0 && daysLeft <= 7) {
                    alerts.push({ id: `${t._id}-wd`, severity: daysLeft <= 2 ? "destructive" : "warning", title: "Withdrawal Ending Soon", description: `Animal ${t.animalId} will be safe in ${daysLeft} days.`, icon: <ShieldAlert className="h-4 w-4" /> });
                }
            }
        });

        // 2. Calculate Recent Activity
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

        // 3. Calculate Quick Stats & Herd Health
        const animalsUnderWithdrawal = new Set(
            treatments.filter(t => t.withdrawalEndDate && new Date(t.withdrawalEndDate) > now).map(t => t.animalId)
        );
        const animalsPendingApproval = new Set(
            treatments.filter(t => t.status === 'Pending').map(t => t.animalId)
        );
        
        const stats = {
            activeTreatments: animalsUnderWithdrawal.size,
            animalsSafeForSale: animals.length - animalsUnderWithdrawal.size,
            pendingApproval: animalsPendingApproval.size
        };

        const healthData = [
            { name: 'Healthy', value: stats.animalsSafeForSale, color: '#22c55e' },
            { name: 'Under Treatment', value: stats.activeTreatments, color: '#f97316' },
            { name: 'Needs Attention', value: stats.pendingApproval, color: '#ef4444' },
        ];

        return {
            herdHealthData: healthData,
            urgentAlerts: alerts.sort((a, b) => (a.severity === 'destructive' ? -1 : 1)).slice(0, 3),
            recentActivity: activity,
            quickStats: stats
        };

    }, [animals, treatments, sales]);

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Hello, {user?.farmOwner || 'Farmer'}!</h1>
                    <p className="mt-1 text-gray-600">Welcome back to your farm dashboard.</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-2">
                    <Button onClick={() => navigate('/farmer/treatments')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Treatment
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/farmer/reports')}>
                        <FileText className="mr-2 h-4 w-4" /> Generate Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChartHorizontalBig className="w-6 h-6 text-green-600" />
                                <span>Herd Health Overview</span>
                            </CardTitle>
                            <CardDescription>A real-time snapshot of your herd's health status.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={herdHealthData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}>
                                            {herdHealthData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} Animals`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                                {herdHealthData.map(item => (
                                    <div key={item.name} className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                        <span className="ml-auto text-sm font-semibold">{item.value} Animals</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Recent Farm Activity</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Animal/Batch ID</TableHead>
                                        <TableHead>Task</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{activity.id}</TableCell>
                                            <TableCell>{activity.task}</TableCell>
                                            <TableCell>
                                                <Badge variant={activity.type === 'Treatment' ? 'default' : 'secondary'}>{activity.type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-gray-500">{formatDistanceToNow(activity.date, { addSuffix: true })}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan="4" className="text-center">No recent activity found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-red-500" />
                                <span>Urgent Alerts</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             {urgentAlerts.length > 0 ? urgentAlerts.map(alert => (
                                <Alert key={alert.id} variant={alert.severity}>
                                    {alert.icon}
                                    <AlertTitle className="font-semibold">{alert.title}</AlertTitle>
                                    <AlertDescription>{alert.description}</AlertDescription>
                                </Alert>
                            )) : (
                                <p className="text-sm text-center text-gray-500 py-4">No urgent alerts.</p>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-500" />
                                <span>Quick Stats</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Active Treatments</span>
                                <span className="font-bold text-lg">{quickStats.activeTreatments}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Animals Safe for Sale</span>
                                <span className="font-bold text-lg text-green-600">{quickStats.animalsSafeForSale}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Pending Vet Approval</span>
                                <span className="font-bold text-lg">{quickStats.pendingApproval}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;