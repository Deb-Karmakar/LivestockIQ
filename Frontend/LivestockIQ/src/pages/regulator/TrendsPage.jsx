// frontend/src/pages/regulator/TrendsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/use-toast';
import { getTrendData } from '../../services/regulatorService';
import { Loader2, Syringe, PawPrint } from 'lucide-react';

// Function to generate random colors for the chart bars/lines
const generateColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
    return colors[index % colors.length];
};

const TrendsPage = () => {
    const [trendData, setTrendData] = useState(null);
    const [loading, setLoading] = useState(true);
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

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!trendData) {
        return <div className="text-center p-8">Could not load trend data.</div>;
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Trend Analysis</h1>
                <p className="mt-1 text-gray-600">Analyze antimicrobial usage patterns over the last 12 months.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Syringe className="w-5 h-5" />
                        AMU by Drug Type
                    </CardTitle>
                    <CardDescription>Total approved treatments grouped by the type of drug used each month.</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PawPrint className="w-5 h-5" />
                        AMU by Animal Species
                    </CardTitle>
                    <CardDescription>Total approved treatments grouped by animal species each month.</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
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