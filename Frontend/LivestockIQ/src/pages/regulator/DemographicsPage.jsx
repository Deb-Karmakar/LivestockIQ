// frontend/src/pages/regulator/DemographicsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '../../hooks/use-toast';
import { getDemographicsData } from '../../services/regulatorService';
import { PawPrint, Cake, Users, Sparkles } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const DemographicsPage = () => {
    const [demographicsData, setDemographicsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getDemographicsData();
            setDemographicsData(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load demographics data.' });
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
                <p className="text-gray-500 font-medium">Loading demographics data...</p>
            </div>
        );
    }

    if (!demographicsData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Could not load demographics data.</p>
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
                            <span>Animal Demographics</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Animal Demographics
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            A snapshot of the composition of all registered livestock. View species distribution, age groups, and gender breakdown.
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2"><PawPrint className="w-5 h-5" /> Herd Composition by Species</CardTitle>
                        <CardDescription>Percentage of each animal species across all farms</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={demographicsData.herdComposition} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={120} fill="#8884d8" dataKey="value">
                                    {demographicsData.herdComposition.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value.toLocaleString('en-IN')} Animals`, 'Count']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2"><Cake className="w-5 h-5" /> Population by Age Group</CardTitle>
                        <CardDescription>Total number of animals within predefined age ranges</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demographicsData.ageDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => value.toLocaleString('en-IN')} />
                                <Tooltip formatter={(value) => value.toLocaleString('en-IN')} />
                                <Legend />
                                <Bar dataKey="count" fill="#82ca9d" name="Animal Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Species Details Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Species Details</CardTitle>
                    <CardDescription>A detailed breakdown of the animal population by species and gender</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Species</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Male</TableHead>
                                <TableHead className="text-right">Female</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {demographicsData.speciesGenderBreakdown.map(item => (
                                <TableRow key={item.species}>
                                    <TableCell className="font-medium">{item.species}</TableCell>
                                    <TableCell className="text-right font-bold">{item.total.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-right">{item.Male.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-right">{item.Female.toLocaleString('en-IN')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default DemographicsPage;