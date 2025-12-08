// frontend/src/pages/lab/LabDashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import {
    FlaskConical,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Clock,
    Sparkles,
    Plus
} from 'lucide-react';
import { getLabDashboard } from '../../services/labService';
import { useToast } from '../../hooks/use-toast';

const LabDashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await getLabDashboard();
                setDashboardData(data);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load dashboard' });
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [toast]);

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

    const stats = dashboardData?.stats || {};
    const recentTests = dashboardData?.recentLabTests || [];
    const labTech = dashboardData?.labTechnician || {};

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Lab Portal</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Welcome, {labTech.fullName || 'Lab Technician'}
                        </h1>
                        <p className="text-emerald-200 max-w-md">
                            {labTech.labName} • ID: {labTech.labTechId}
                        </p>
                    </div>
                    <Button
                        size="lg"
                        className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg"
                        onClick={() => navigate('/lab/upload-test')}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Upload MRL Test
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <FlaskConical className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Tests</p>
                                <p className="text-2xl font-bold">{stats.totalTests || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Passed</p>
                                <p className="text-2xl font-bold text-green-600">{stats.passedTests || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Failed</p>
                                <p className="text-2xl font-bold text-red-600">{stats.failedTests || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pass Rate</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.passRate || 0}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Tests */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Recent MRL Tests
                    </CardTitle>
                    <CardDescription>Your latest test uploads</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentTests.length > 0 ? (
                        <div className="space-y-3">
                            {recentTests.map((test, index) => (
                                <div key={test._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${test.isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
                                            {test.isPassed ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{test.animalId}</p>
                                            <p className="text-sm text-gray-500">{test.drugName} • {test.productType}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={test.isPassed ? 'success' : 'destructive'}>
                                            {test.isPassed ? 'PASSED' : 'FAILED'}
                                        </Badge>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(test.testDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <FlaskConical className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No tests uploaded yet</p>
                            <Button
                                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => navigate('/lab/upload-test')}
                            >
                                Upload Your First Test
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default LabDashboardPage;
