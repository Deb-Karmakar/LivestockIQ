// frontend/src/pages/regulator/TrendsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/use-toast';
import { getTrendData } from '../../services/regulatorService';
import { getRegulatorInsights } from '../../services/aiService';
import { Button } from "@/components/ui/button";
import { Syringe, PawPrint, Sparkles, BrainCircuit } from 'lucide-react';

const generateColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
    return colors[index % colors.length];
};

const TrendsPage = () => {
    const [trendData, setTrendData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState(null);
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTrendData();
            setTrendData(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load trend data.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

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
                            <span>Trend Analysis</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Trend Analysis
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Analyze antimicrobial usage patterns over the last 12 months. Track drug types and species-specific trends.
                        </p>
                    </div>
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
                                Generate AI Insights
                            </>
                        )}
                    </Button>
                </div>
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

            {/* Charts */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Syringe className="w-5 h-5" />
                        AMU by Drug Type
                    </CardTitle>
                    <CardDescription>Total approved treatments grouped by the type of drug used each month</CardDescription>
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

            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                        <PawPrint className="w-5 h-5" />
                        AMU by Animal Species
                    </CardTitle>
                    <CardDescription>Total approved treatments grouped by animal species each month</CardDescription>
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