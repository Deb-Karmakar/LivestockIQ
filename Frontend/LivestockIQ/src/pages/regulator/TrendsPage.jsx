// frontend/src/pages/regulator/TrendsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/use-toast';
import { getTrendDataEnhanced } from '../../services/trendsEnhancedService';
import { getRegulatorInsights } from '../../services/aiService';
import { Button } from "@/components/ui/button";
import { Syringe, PawPrint, Sparkles, BrainCircuit, TrendingUp, AlertTriangle, FileText, Calendar, TrendingDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const generateColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
    return colors[index % colors.length];
};

// Summary Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25'
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

const TrendsPage = () => {
    const [trendData, setTrendData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState(null);
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const [period, setPeriod] = useState('12m');
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Use the enhanced trend data service which supports period
            const data = await getTrendDataEnhanced(period);
            setTrendData(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load trend data.' });
        } finally {
            setLoading(false);
        }
    }, [period, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGenerateInsights = async () => {
        try {
            setGeneratingInsights(true);
            const data = await getRegulatorInsights();
            setInsights(data.insights);
            toast({ title: "Insights Generated", description: "AI analysis complete." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to generate insights." });
        } finally {
            setGeneratingInsights(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading trend data...</p>
            </div>
        );
    }

    if (!trendData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Could not load trend data.</p>
            </div>
        );
    }

    const getRiskBadgeVariant = (risk) => {
        switch (risk) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'outline';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'elevated': return 'text-yellow-600 bg-yellow-50';
            default: return 'text-gray-600 bg-gray-50';
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
                            <span>Advanced Trend Analysis</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            AMU Trend Analysis
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Comprehensive antimicrobial usage tracking across treatments and medicated feed. Monitor trends, identify high-risk drugs, and detect farms with abnormal usage patterns.
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
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
                        <Button
                            onClick={handleGenerateInsights}
                            disabled={generatingInsights}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {generatingInsights ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="w-4 h-4 mr-2" />
                                    AI Insights
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total AMU"
                    value={trendData.summary.totalTreatments.toLocaleString()}
                    subtitle={`${trendData.summary.treatmentOnly} treatments + ${trendData.summary.feedOnly} feed`}
                    icon={Syringe}
                    color="blue"
                />
                <StatCard
                    title="Unique Drugs"
                    value={trendData.summary.uniqueDrugs}
                    subtitle="Different antimicrobials"
                    icon={FileText}
                    color="green"
                />
                <StatCard
                    title="Avg Per Farm"
                    value={trendData.summary.avgTreatmentsPerFarm}
                    subtitle="AMU administrations"
                    icon={TrendingUp}
                    color="purple"
                />
                <StatCard
                    title="High AMU Alerts"
                    value={trendData.summary.alertsTriggered}
                    subtitle="Farms flagged"
                    icon={AlertTriangle}
                    color="orange"
                />
            </div>

            {/* AI Insights Card */}
            {insights && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-l-indigo-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <BrainCircuit className="w-6 h-6 text-indigo-600" />
                            AI Strategic Analysis
                        </CardTitle>
                        <CardDescription className="text-indigo-700">
                            Automated analysis of AMU trends and risk assessment
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed">
                            <ReactMarkdown>{insights}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Treatment vs Feed Chart */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        AMU by Administration Method
                    </CardTitle>
                    <CardDescription>Antimicrobials via direct treatment vs medicated feed (PS Requirement)</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData.amuByMethod.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="treatment" stackId="1" stroke="#0088FE" fill="#0088FE" name="Direct Treatment" />
                            <Area type="monotone" dataKey="feed" stackId="1" stroke="#00C49F" fill="#00C49F" name="Medicated Feed" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top 10 Drugs Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Syringe className="w-5 h-5" />
                        Top 10 Most Used Antimicrobials
                    </CardTitle>
                    <CardDescription>Ranked by usage with WHO risk classification</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Drug Name</TableHead>
                                <TableHead className="text-right">Usage Count</TableHead>
                                <TableHead className="text-right">% of Total</TableHead>
                                <TableHead className="text-center">WHO Risk</TableHead>
                                <TableHead className="text-center">Trend</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trendData.topDrugs && trendData.topDrugs.length > 0 ? (
                                trendData.topDrugs.map(drug => (
                                    <TableRow key={drug.rank}>
                                        <TableCell className="font-bold text-gray-500">{drug.rank}</TableCell>
                                        <TableCell className="font-medium">{drug.name}</TableCell>
                                        <TableCell className="text-right">{drug.count.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{drug.percentage}%</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getRiskBadgeVariant(drug.riskLevel)} className="uppercase text-xs">
                                                {drug.riskLevel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-lg">{drug.trend === 'up' ? <TrendingUp /> : drug.trend === 'down' ? <TrendingDown /> : <ArrowRight />}</span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan="6" className="text-center text-gray-500 py-8">
                                        No drug data available for this period
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* High AMU Farms */}
            {trendData.highAmuFarms && trendData.highAmuFarms.length > 0 && (
                <Card className="border-0 shadow-lg border-l-4 border-l-orange-500">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-orange-900">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            High AMU Farms (Above Average Usage)
                        </CardTitle>
                        <CardDescription className="text-orange-700">
                            Farms with usage significantly above the regional average
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {trendData.highAmuFarms.map(farm => (
                                <div
                                    key={farm.id}
                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/regulator/farms/${farm.id}`)}
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{farm.name}</p>
                                        <p className="text-sm text-gray-500">{farm.owner}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">{farm.treatments}</p>
                                            <p className="text-xs text-gray-500">treatments</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(farm.status)}`}>
                                            {farm.percentileRank}% of avg
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AMU by Drug Type (Bar Chart) */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Syringe className="w-5 h-5" />
                        AMU by Drug Type
                    </CardTitle>
                    <CardDescription>Total approved treatments grouped by drug type each month</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData.amuByDrug.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {trendData.amuByDrug.keys.map((key, index) => (
                                <Bar key={key} dataKey={key} stackId="a" fill={generateColor(index)} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* AMU by Species (Line Chart) */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                        <PawPrint className="w-5 h-5" />
                        AMU by Animal Species
                    </CardTitle>
                    <CardDescription>Total approved treatments grouped by species each month</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData.amuBySpecies.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {trendData.amuBySpecies.keys.map((key, index) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={generateColor(index)} strokeWidth={2} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default TrendsPage;
