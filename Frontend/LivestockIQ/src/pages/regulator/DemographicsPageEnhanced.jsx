// frontend/src/pages/regulator/DemographicsPageEnhanced.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from '../../hooks/use-toast';
import { getDemographicsDataEnhanced } from '../../services/regulatorServiceEnhanced';
import { PawPrint, Cake, Users, Sparkles, MapPin, Syringe, Shield, TrendingUp, Calendar, Activity } from 'lucide-react';

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

// Summary Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
        red: 'from-red-500 to-red-600 shadow-red-500/25'
    };

    return (
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-[0.03]`} />
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
                        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                    </div>
                    {Icon && (
                        <div className={`p-3 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10`}>
                            <Icon className="w-6 h-6 text-gray-700" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const DemographicsPageEnhanced = () => {
    const [demographicsData, setDemographicsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('12m');
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getDemographicsDataEnhanced(period);
            setDemographicsData(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load demographics data.' });
        } finally {
            setLoading(false);
        }
    }, [period, toast]);

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

    const getMRLBadgeColor = (status) => {
        switch (status) {
            case 'SAFE': return 'bg-green-100 text-green-800';
            case 'WITHDRAWAL_ACTIVE': return 'bg-yellow-100 text-yellow-800';
            case 'TEST_REQUIRED': return 'bg-orange-100 text-orange-800';
            case 'PENDING_VERIFICATION': return 'bg-blue-100 text-blue-800';
            case 'VIOLATION': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

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
                            <span>Enhanced Animal Demographics</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Comprehensive Demographics Analysis
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Animal demographics with regional distribution, AMU correlation, MRL compliance metrics, and temporal trends.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                                <Calendar className="w-4 h-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                <SelectItem value="3m">Last 3 Months</SelectItem>
                                <SelectItem value="6m">Last 6 Months</SelectItem>
                                <SelectItem value="12m">Last 12 Months</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Total Animals"
                    value={demographicsData.summary.totalAnimals.toLocaleString()}
                    subtitle={`${demographicsData.summary.totalSpecies} species`}
                    icon={PawPrint}
                    color="blue"
                />
                <StatCard
                    title="Regions"
                    value={demographicsData.summary.totalRegions}
                    subtitle="Active locations"
                    icon={MapPin}
                    color="green"
                />
                <StatCard
                    title="Total AMU"
                    value={demographicsData.summary.totalAMU.toLocaleString()}
                    subtitle={demographicsData.summary.period}
                    icon={Syringe}
                    color="purple"
                />
                <StatCard
                    title="MRL Compliance"
                    value={`${demographicsData.summary.avgMRLCompliance}%`}
                    subtitle="Average across species"
                    icon={Shield}
                    color="orange"
                />
                <StatCard
                    title="Population"
                    value={demographicsData.temporalTrends.currentTotal.toLocaleString()}
                    subtitle="Current total"
                    icon={Activity}
                    color="red"
                />
            </div>

            {/* Row 1: Herd Composition & Regional Distribution */}
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
                        <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Geographic Zones</CardTitle>
                        <CardDescription>Top zones by animal population (1° Grid)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-96 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Zone Coordinates</TableHead>
                                    <TableHead className="text-right">Farms</TableHead>
                                    <TableHead className="text-right">Animals</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {demographicsData.regionalDistribution.slice(0, 10).map((region, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{region.region}</span>
                                                <span className="text-xs text-gray-500">{region.state}, {region.district}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{region.farms}</TableCell>
                                        <TableCell className="text-right font-bold">{region.animals.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Age Distribution & AMU Correlation */}
            <div className="grid gap-6 lg:grid-cols-2">
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

                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2"><Syringe className="w-5 h-5" /> AMU Correlation by Species</CardTitle>
                        <CardDescription>Average antimicrobial usage per animal by species</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demographicsData.amuCorrelation.bySpecies} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="species" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avgAMUPerAnimal" fill="#8884d8" name="Avg AMU per Animal" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: MRL Compliance by Species */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> MRL Compliance by Species</CardTitle>
                    <CardDescription>Maximum Residue Limit status distribution across species</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographicsData.mrlCompliance.bySpecies} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="species" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="SAFE" stackId="a" fill="#10b981" name="Safe" />
                            <Bar dataKey="WITHDRAWAL_ACTIVE" stackId="a" fill="#f59e0b" name="Withdrawal Active" />
                            <Bar dataKey="TEST_REQUIRED" stackId="a" fill="#ef4444" name="Test Required" />
                            <Bar dataKey="PENDING_VERIFICATION" stackId="a" fill="#3b82f6" name="Pending Verification" />
                            <Bar dataKey="VIOLATION" stackId="a" fill="#dc2626" name="Violation" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Row 4: Population Trends Over Time */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Population Trends</CardTitle>
                    <CardDescription>New animal registrations over time ({demographicsData.summary.period})</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={demographicsData.temporalTrends.populationByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monthShort" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="newRegistrations" stroke="#8884d8" strokeWidth={2} name="New Registrations" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Row 5: Enhanced Species Details Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Enhanced Species Details</CardTitle>
                    <CardDescription>Comprehensive breakdown with AMU and MRL compliance metrics</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Species</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Male</TableHead>
                                <TableHead className="text-right">Female</TableHead>
                                <TableHead className="text-right">Avg AMU</TableHead>
                                <TableHead className="text-right">MRL Compliance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {demographicsData.speciesGenderBreakdown.map(item => {
                                const amuData = demographicsData.amuCorrelation.bySpecies.find(a => a.species === item.species);
                                const mrlData = demographicsData.mrlCompliance.bySpecies.find(m => m.species === item.species);

                                return (
                                    <TableRow key={item.species}>
                                        <TableCell className="font-medium">{item.species}</TableCell>
                                        <TableCell className="text-right font-bold">{item.total.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right">{item.Male.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right">{item.Female.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right">
                                            {amuData ? amuData.avgAMUPerAnimal.toFixed(2) : '0.00'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={mrlData ? getMRLBadgeColor('SAFE') : 'bg-gray-100 text-gray-800'}>
                                                {mrlData ? `${mrlData.compliancePercentage}%` : 'N/A'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default DemographicsPageEnhanced;
