// frontend/src/pages/regulator/MRLAnalysisPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    FlaskConical,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Search,
    Filter,
    RefreshCw,
    Building2,
    PawPrint,
    Pill,
    Calendar,
    Eye,
    ThumbsUp,
    ThumbsDown,
    Flag,
    BarChart3,
    PieChart,
    Activity,
    Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line, AreaChart, Area } from 'recharts';
import { getMRLAnalysisDashboard, getAllLabTests, reviewLabTest, getFilterOptions } from '../../services/mrlAnalysisService';
import { useToast } from '../../hooks/use-toast';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const MRLAnalysisPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [tests, setTests] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [filterOptions, setFilterOptions] = useState({ drugs: [], species: [], labs: [], statuses: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTest, setSelectedTest] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [filters, setFilters] = useState({ drug: '', species: 'all', status: 'all', isPassed: 'all' });
    const { toast } = useToast();

    useEffect(() => {
        fetchDashboard();
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        if (activeTab === 'tests') {
            fetchTests();
        }
    }, [activeTab, filters]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const data = await getMRLAnalysisDashboard();
            setDashboardData(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load MRL analysis data' });
        } finally {
            setLoading(false);
        }
    };

    const fetchTests = async (page = 1) => {
        try {
            const data = await getAllLabTests({ ...filters, page });
            setTests(data.data || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1 });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load tests' });
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const options = await getFilterOptions();
            setFilterOptions(options);
        } catch (error) {
            console.error('Failed to load filter options');
        }
    };

    const handleReview = async (action) => {
        if (!selectedTest) return;
        try {
            await reviewLabTest(selectedTest._id, action, reviewNotes);
            toast({ title: 'Success', description: `Test ${action}d successfully` });
            setSelectedTest(null);
            setReviewNotes('');
            fetchDashboard();
            if (activeTab === 'tests') fetchTests();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to review test' });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading MRL Analysis...</p>
            </div>
        );
    }

    const summary = dashboardData?.summary || {};
    const charts = dashboardData?.charts || {};

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                            <FlaskConical className="w-4 h-4" />
                            <span>Regulatory Oversight</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">MRL Analysis Dashboard</h1>
                        <p className="text-emerald-200">Analyze lab test results across all registered laboratories</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FlaskConical className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Tests</p>
                                <p className="text-xl font-bold">{summary.totalTests || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Passed</p>
                                <p className="text-xl font-bold text-green-600">{summary.passedTests || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Failed</p>
                                <p className="text-xl font-bold text-red-600">{summary.failedTests || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Pass Rate</p>
                                <p className="text-xl font-bold text-purple-600">{summary.overallPassRate || 0}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Building2 className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Labs</p>
                                <p className="text-xl font-bold">{summary.uniqueLabs || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Pending Review</p>
                                <p className="text-xl font-bold text-orange-600">{summary.pendingReview || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-2" />Overview</TabsTrigger>
                    <TabsTrigger value="trends"><Activity className="w-4 h-4 mr-2" />Trends</TabsTrigger>
                    <TabsTrigger value="drugs"><Pill className="w-4 h-4 mr-2" />By Drug</TabsTrigger>
                    <TabsTrigger value="tests"><FlaskConical className="w-4 h-4 mr-2" />All Tests</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tests by Species */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PawPrint className="w-5 h-5" />Tests by Species</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie data={charts.testsBySpecies || []} dataKey="total" nameKey="species" cx="50%" cy="50%" outerRadius={100} label={({ species, total }) => `${species}: ${total}`}>
                                                {(charts.testsBySpecies || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tests by Lab */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Tests by Laboratory</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={charts.testsByLab || []} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="labName" type="category" width={100} tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="passed" stackId="a" fill="#22c55e" name="Passed" />
                                            <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Failed Tests Requiring Attention */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600"><XCircle className="w-5 h-5" />Failed Tests Requiring Attention</CardTitle>
                            <CardDescription>Recent tests that failed MRL compliance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Animal ID</TableHead>
                                            <TableHead>Drug</TableHead>
                                            <TableHead>Residue</TableHead>
                                            <TableHead>MRL Limit</TableHead>
                                            <TableHead>Lab</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(dashboardData?.failedTests || []).slice(0, 10).map((test) => (
                                            <TableRow key={test._id} className="bg-red-50/50">
                                                <TableCell className="font-mono">{test.animalTagId}</TableCell>
                                                <TableCell>{test.drugOrSubstanceTested}</TableCell>
                                                <TableCell className="text-red-600 font-medium">{test.residueLevelDetected} {test.unit}</TableCell>
                                                <TableCell>{test.mrlThreshold} {test.unit}</TableCell>
                                                <TableCell>{test.labName}</TableCell>
                                                <TableCell>{new Date(test.testDate).toLocaleDateString()}</TableCell>
                                                <TableCell><Badge variant="outline">{test.status}</Badge></TableCell>
                                                <TableCell>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" onClick={() => setSelectedTest(test)}><Eye className="w-4 h-4" /></Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Review Test Result</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div><p className="text-gray-500">Animal</p><p className="font-medium">{test.animalTagId}</p></div>
                                                                    <div><p className="text-gray-500">Drug</p><p className="font-medium">{test.drugOrSubstanceTested}</p></div>
                                                                    <div><p className="text-gray-500">Residue Level</p><p className="font-medium text-red-600">{test.residueLevelDetected} {test.unit}</p></div>
                                                                    <div><p className="text-gray-500">MRL Threshold</p><p className="font-medium">{test.mrlThreshold} {test.unit}</p></div>
                                                                    <div><p className="text-gray-500">Lab</p><p className="font-medium">{test.labName}</p></div>
                                                                    <div><p className="text-gray-500">Farm</p><p className="font-medium">{test.farmName}</p></div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 text-sm mb-2">Review Notes</p>
                                                                    <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Add notes for this review..." />
                                                                </div>
                                                            </div>
                                                            <DialogFooter className="gap-2">
                                                                <Button variant="outline" onClick={() => handleReview('flag')}><Flag className="w-4 h-4 mr-2" />Flag</Button>
                                                                <Button variant="destructive" onClick={() => handleReview('reject')}><ThumbsDown className="w-4 h-4 mr-2" />Reject</Button>
                                                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleReview('approve')}><ThumbsUp className="w-4 h-4 mr-2" />Approve</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Trends Tab */}
                <TabsContent value="trends" className="space-y-6 mt-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Monthly Test Trends</CardTitle>
                            <CardDescription>Test volume and pass rates over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.monthlyTrend || []}>
                                        <defs>
                                            <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="passed" stroke="#22c55e" fillOpacity={1} fill="url(#colorPassed)" name="Passed" />
                                        <Area type="monotone" dataKey="failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" name="Failed" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Pass Rate Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts.monthlyTrend || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="passRate" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} name="Pass Rate %" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By Drug Tab */}
                <TabsContent value="drugs" className="space-y-6 mt-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5" />Tests by Drug/Substance</CardTitle>
                            <CardDescription>Pass/fail breakdown for each tested substance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.testsByDrug || []} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="drug" type="category" width={120} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="passed" stackId="a" fill="#22c55e" name="Passed" />
                                        <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Drug Compliance Analysis</CardTitle>
                            <CardDescription>Detailed statistics for each drug</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Drug</TableHead>
                                        <TableHead>Total Tests</TableHead>
                                        <TableHead>Passed</TableHead>
                                        <TableHead>Pass Rate</TableHead>
                                        <TableHead>Avg Residue</TableHead>
                                        <TableHead>Avg MRL</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(charts.passRateByDrug || []).map((drug, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{drug.drug}</TableCell>
                                            <TableCell>{drug.total}</TableCell>
                                            <TableCell>{drug.passed}</TableCell>
                                            <TableCell>
                                                <Badge className={drug.passRate >= 80 ? 'bg-green-100 text-green-800' : drug.passRate >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}>
                                                    {drug.passRate}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{drug.avgResidueLevel} µg/kg</TableCell>
                                            <TableCell>{drug.avgMRLThreshold} µg/kg</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* All Tests Tab */}
                <TabsContent value="tests" className="space-y-6 mt-6">
                    {/* Filters */}
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <Input placeholder="Search drug..." value={filters.drug} onChange={(e) => setFilters(p => ({ ...p, drug: e.target.value }))} />
                                </div>
                                <Select value={filters.species} onValueChange={(v) => setFilters(p => ({ ...p, species: v }))}>
                                    <SelectTrigger className="w-40"><SelectValue placeholder="Species" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Species</SelectItem>
                                        {filterOptions.species.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v }))}>
                                    <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        {filterOptions.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.isPassed} onValueChange={(v) => setFilters(p => ({ ...p, isPassed: v }))}>
                                    <SelectTrigger className="w-32"><SelectValue placeholder="Result" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="true">Passed</SelectItem>
                                        <SelectItem value="false">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => fetchTests()}><Search className="w-4 h-4 mr-2" />Search</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tests Table */}
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Report #</TableHead>
                                            <TableHead>Animal ID</TableHead>
                                            <TableHead>Species</TableHead>
                                            <TableHead>Drug</TableHead>
                                            <TableHead>Residue</TableHead>
                                            <TableHead>MRL</TableHead>
                                            <TableHead>Result</TableHead>
                                            <TableHead>Lab</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tests.map((test) => (
                                            <TableRow key={test._id}>
                                                <TableCell className="font-mono text-xs">{test.testReportNumber}</TableCell>
                                                <TableCell className="font-mono">{test.animalTagId}</TableCell>
                                                <TableCell>{test.animalSpecies}</TableCell>
                                                <TableCell>{test.drugOrSubstanceTested}</TableCell>
                                                <TableCell className={test.isPassed ? '' : 'text-red-600 font-medium'}>{test.residueLevelDetected}</TableCell>
                                                <TableCell>{test.mrlThreshold}</TableCell>
                                                <TableCell>
                                                    {test.isPassed ? (
                                                        <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />PASS</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />FAIL</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">{test.labName}</TableCell>
                                                <TableCell>{new Date(test.testDate).toLocaleDateString()}</TableCell>
                                                <TableCell><Badge variant="outline">{test.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Pagination */}
                            <div className="flex justify-center p-4 border-t">
                                <div className="flex gap-2">
                                    <Button variant="outline" disabled={pagination.currentPage <= 1} onClick={() => fetchTests(pagination.currentPage - 1)}>Previous</Button>
                                    <span className="flex items-center px-4 text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>
                                    <Button variant="outline" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => fetchTests(pagination.currentPage + 1)}>Next</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MRLAnalysisPage;
