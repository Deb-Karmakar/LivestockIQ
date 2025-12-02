// Frontend/src/pages/regulator/ReportsPage.jsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileDown,
    Settings2,
    Loader2,
    FileText,
    Download,
    Calendar,
    RefreshCw,
    PieChart as PieChartIcon,
    Activity,
    Sparkles,
    ShieldAlert,
    Stethoscope,
    Syringe,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { generateReport } from '@/services/regulatorService';
import {
    getComplianceReportData,
    getAmuTrendsReportData,
    getWhoAwareReportData,
    getVetOversightReportData,
    getFarmRiskReportData,
    getFeedVsTherapeuticReportData
} from '@/services/reportAnalyticsService';
import { format } from 'date-fns';

// Color palette
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded-lg shadow-lg p-3">
                <p className="font-semibold">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {typeof entry.value === 'number' ?
                            entry.value.toFixed(2) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function RegulatorReportsPage() {
    const { toast } = useToast();
    const [selectedReportType, setSelectedReportType] = useState('');
    const [dateRange, setDateRange] = useState({
        from: '',
        to: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [activeTab, setActiveTab] = useState('visualization');

    const reportTypes = [
        {
            value: 'Compliance',
            label: 'Compliance & Violation',
            icon: ShieldAlert,
            desc: 'Regulatory compliance status and violations'
        },
        {
            value: 'AmuTrends',
            label: 'AMU Trends',
            icon: Activity,
            desc: 'Antimicrobial usage trends over time'
        },
        {
            value: 'WhoAware',
            label: 'WHO AWaRe Stewardship',
            icon: ShieldAlert,
            desc: 'Usage breakdown by WHO AWaRe classification'
        },
        {
            value: 'VetOversight',
            label: 'Veterinarian Oversight',
            icon: Stethoscope,
            desc: 'Veterinary prescription and oversight activities'
        },
        {
            value: 'FarmRisk',
            label: 'Farm-Level Risk Profile',
            icon: FileText,
            desc: 'Risk assessment profiles for farms'
        },
        {
            value: 'FeedVsTherapeutic',
            label: 'Feed vs. Therapeutic',
            icon: Syringe,
            desc: 'Comparison of medicated feed vs therapeutic usage'
        }
    ];

    const handleGenerateReport = async () => {
        if (!selectedReportType) {
            toast({
                title: "Selection Required",
                description: "Please select a report type",
                variant: "destructive"
            });
            return;
        }

        if (!dateRange.from || !dateRange.to) {
            toast({
                title: "Date Range Required",
                description: "Please select both start and end dates",
                variant: "destructive"
            });
            return;
        }

        setIsGenerating(true);
        setIsFetchingData(true);

        try {
            const fromDate = new Date(dateRange.from).toISOString();
            const toDate = new Date(dateRange.to).toISOString();

            // Fetch real data based on report type
            let dataResponse = null;
            switch (selectedReportType) {
                case 'Compliance':
                    dataResponse = await getComplianceReportData(fromDate, toDate);
                    break;
                case 'AmuTrends':
                    dataResponse = await getAmuTrendsReportData(fromDate, toDate);
                    break;
                case 'WhoAware':
                    dataResponse = await getWhoAwareReportData(fromDate, toDate);
                    break;
                case 'VetOversight':
                    dataResponse = await getVetOversightReportData(fromDate, toDate);
                    break;
                case 'FarmRisk':
                    dataResponse = await getFarmRiskReportData(fromDate, toDate);
                    break;
                case 'FeedVsTherapeutic':
                    dataResponse = await getFeedVsTherapeuticReportData(fromDate, toDate);
                    break;
            }

            setReportData(dataResponse);
            setIsFetchingData(false);

            // Trigger PDF Download
            const pdfData = await generateReport({
                from: fromDate,
                to: toDate
            }, selectedReportType);

            const blob = new Blob([pdfData], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedReportType}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Report Generated",
                description: "PDF downloaded successfully. Visualization updated with real data."
            });

        } catch (error) {
            console.error("Report generation error:", error);
            setIsFetchingData(false);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to generate report.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const exportToCSV = () => {
        if (!reportData) {
            toast({
                title: "No Report Generated",
                description: "Please generate a report first before exporting",
                variant: "destructive"
            });
            return;
        }

        if (!reportData.data || reportData.data.length === 0) {
            toast({
                title: "No Data Available",
                description: "The report contains no data to export.",
                variant: "destructive"
            });
            return;
        }

        try {
            let csvContent = '\uFEFF'; // BOM for Excel UTF-8 recognition

            // Add report header
            csvContent += `Report Type: ${reportData.reportType}\n`;
            csvContent += `Generated At: ${new Date(reportData.generatedAt).toLocaleString()}\n\n`;

            // Add data based on report type
            switch (reportData.reportType) {
                case 'Compliance':
                    csvContent += 'Region,Compliant,Violations\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.name || 'N/A'}",${row.compliant || 0},${row.violations || 0}\n`;
                    });
                    break;

                case 'AmuTrends':
                    csvContent += 'Period,Usage Count\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.name || 'N/A'}",${row.usage || 0}\n`;
                    });
                    break;

                case 'WhoAware':
                    csvContent += 'Drug Class,Count\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.name || 'N/A'}",${row.value || 0}\n`;
                    });
                    break;

                case 'VetOversight':
                    csvContent += 'Veterinarian,Visits,Prescriptions,Approval Rate %,Feed Prescriptions\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.name || 'N/A'}",${row.visits || 0},${row.prescriptions || 0},${row.approvalRate || 0},${row.feedPrescriptions || 0}\n`;
                    });
                    break;

                case 'FarmRisk':
                    csvContent += 'Farm Name,Treatment Count,Alert Count,Violation Count,Risk Score,Risk Level\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.farmName || 'N/A'}",${row.treatmentCount || 0},${row.alertCount || 0},${row.violationCount || 0},${row.riskScore || 0},"${row.riskLevel || 'N/A'}"\n`;
                    });
                    break;

                case 'FeedVsTherapeutic':
                    csvContent += 'Type,Count\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.name || 'N/A'}",${row.value || 0}\n`;
                    });
                    break;

                default:
                    // Generic export
                    if (reportData.data.length > 0) {
                        const headers = Object.keys(reportData.data[0]);
                        csvContent += headers.join(',') + '\n';
                        reportData.data.forEach(row => {
                            const values = headers.map(header => {
                                const value = row[header];
                                if (value === null || value === undefined) return '';
                                if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
                                return value;
                            });
                            csvContent += values.join(',') + '\n';
                        });
                    }
            }

            // Add summary section
            if (reportData.summary) {
                csvContent += '\n\nSummary\n';
                Object.entries(reportData.summary).forEach(([key, value]) => {
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                    const formattedValue = typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value;
                    csvContent += `"${formattedKey}",${formattedValue}\n`;
                });
            }

            // Create and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${reportData.reportType}-${timestamp}.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: "Export Successful",
                description: `Report exported as ${filename}`
            });

        } catch (error) {
            console.error('CSV Export Error:', error);
            toast({
                title: "Export Failed",
                description: "Failed to export report to CSV",
                variant: "destructive"
            });
        }
    };

    const clearFilters = () => {
        setDateRange({ from: '', to: '' });
        setSelectedReportType('');
        setReportData(null);
    };

    const renderSummaryCards = () => {
        if (!reportData || !reportData.summary) return null;

        const { summary } = reportData;
        const cards = [];

        // Different cards for different report types
        switch (reportData.reportType) {
            case 'Compliance':
                cards.push(
                    { label: 'Total Treatments', value: summary.totalTreatments, icon: Activity },
                    { label: 'Compliance Rate', value: `${summary.complianceRate}%`, icon: ShieldAlert, trend: summary.complianceRate >= 90 ? 'up' : 'down' },
                    { label: 'Total Violations', value: summary.totalViolations, icon: ShieldAlert },
                    { label: 'Farms with Violations', value: summary.farmsWithViolations, icon: FileText }
                );
                break;

            case 'AmuTrends':
                cards.push(
                    { label: 'Total Treatments', value: summary.totalTreatments, icon: Activity },
                    { label: 'Unique Drugs', value: summary.uniqueDrugs, icon: Syringe },
                    { label: 'Farms Involved', value: summary.farmsInvolved, icon: FileText },
                    { label: 'Avg Per Month', value: summary.averagePerMonth, icon: TrendingUp }
                );
                break;

            case 'WhoAware':
                cards.push(
                    { label: 'Access Group', value: summary.accessCount, icon: ShieldAlert },
                    { label: 'Watch Group', value: summary.watchCount, icon: ShieldAlert },
                    { label: 'Reserve Group', value: summary.reserveCount, icon: ShieldAlert },
                    { label: 'Compliance Score', value: `${summary.complianceScore}%`, icon: TrendingUp, trend: summary.complianceScore >= 80 ? 'up' : 'down' }
                );
                break;

            case 'VetOversight':
                cards.push(
                    { label: 'Total Vets', value: summary.totalVets, icon: Stethoscope },
                    { label: 'Total Visits', value: summary.totalVisits, icon: Activity },
                    { label: 'Prescriptions', value: summary.totalPrescriptions, icon: Syringe },
                    { label: 'Avg Approval Rate', value: `${summary.averageApprovalRate}%`, icon: TrendingUp }
                );
                break;

            case 'FarmRisk':
                cards.push(
                    { label: 'High Risk Farms', value: summary.highRiskFarms, icon: ShieldAlert },
                    { label: 'Medium Risk', value: summary.mediumRiskFarms, icon: Activity },
                    { label: 'Low Risk', value: summary.lowRiskFarms, icon: TrendingUp },
                    { label: 'With Violations', value: summary.farmsWithViolations, icon: ShieldAlert }
                );
                break;

            case 'FeedVsTherapeutic':
                cards.push(
                    { label: 'Total Treatments', value: summary.totalTreatments, icon: Activity },
                    { label: 'Therapeutic', value: `${summary.therapeuticPercent}%`, icon: Syringe },
                    { label: 'Feed Based', value: `${summary.feedPercent}%`, icon: FileText },
                    { label: 'Unique Drugs', value: summary.uniqueDrugs, icon: Activity }
                );
                break;
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <Card key={index}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{card.label}</p>
                                        <p className="text-2xl font-bold mt-1">{card.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${card.trend === 'up' ? 'bg-green-100' : card.trend === 'down' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                        {card.trend === 'up' ? (
                                            <TrendingUp className="h-5 w-5 text-green-600" />
                                        ) : card.trend === 'down' ? (
                                            <TrendingDown className="h-5 w-5 text-red-600" />
                                        ) : (
                                            <Icon className="h-5 w-5 text-blue-600" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const renderVisualization = () => {
        if (!reportData || !reportData.data) return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Generate a report to view visualizations</p>
            </div>
        );

        if (reportData.data.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>No data available for this date range</p>
                </div>
            );
        }

        switch (reportData.reportType) {
            case 'Compliance':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="compliant" stackId="a" fill="#10b981" name="Compliant" />
                            <Bar dataKey="violations" stackId="a" fill="#ef4444" name="Violations" />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'AmuTrends':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={2} name="AMU Count" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'WhoAware':
            case 'FarmRisk':
            case 'FeedVsTherapeutic':
                const pieData = reportData.reportType === 'FarmRisk' ? reportData.distribution : reportData.data;
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'VetOversight':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.data.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="visits" fill="#8b5cf6" name="Visits" />
                            <Bar dataKey="prescriptions" fill="#f59e0b" name="Prescriptions" />
                        </BarChart>
                    </ResponsiveContainer>
                );

            default:
                return <p>Visualization not available for this report type.</p>;
        }
    };

    const renderDataTable = () => {
        if (!reportData || !reportData.data || reportData.data.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>No data available</p>
                </div>
            );
        }

        const headers = Object.keys(reportData.data[0]);

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map(header => (
                            <TableHead key={header} className="capitalize">
                                {header.replace(/([A-Z])/g, ' $1').trim()}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.data.slice(0, 50).map((row, index) => (
                        <TableRow key={index}>
                            {headers.map(header => (
                                <TableCell key={`${index}-${header}`}>
                                    {typeof row[header] === 'number' && row[header] % 1 !== 0
                                        ? row[header].toFixed(2)
                                        : row[header]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Reports</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Reports & Analytics
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Generate comprehensive reports with real data visualizations and export capabilities.
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Configuration Card */}
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Report Configuration
                    </CardTitle>
                    <CardDescription>
                        Select a report type and date range to generate an official PDF report with visualizations
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Report Type Selection */}
                    <div className="grid gap-4">
                        <Label className="text-base font-semibold">Report Type</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {reportTypes.map((report) => (
                                <Card
                                    key={report.value}
                                    className={`cursor-pointer transition-all hover:border-primary ${selectedReportType === report.value
                                        ? 'border-primary border-2 bg-primary/5'
                                        : 'border-border'
                                        }`}
                                    onClick={() => setSelectedReportType(report.value)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${selectedReportType === report.value
                                                ? 'bg-primary text-white'
                                                : 'bg-muted'
                                                }`}>
                                                <report.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">{report.label}</h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {report.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date Range
                            </Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-muted-foreground"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Clear Selection
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    type="date"
                                    id="startDate"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    type="date"
                                    id="endDate"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleGenerateReport}
                            disabled={isGenerating || !selectedReportType || !dateRange.from || !dateRange.to}
                            className="w-full md:w-auto min-w-[200px]"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Generate & Download Report
                                </>
                            )}
                        </Button>
                        {reportData && (
                            <Button
                                onClick={exportToCSV}
                                variant="outline"
                                className="w-full md:w-auto"
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Export to CSV
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Report Results */}
            {isFetchingData && (
                <Card>
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Loading report data...</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {reportData && !isFetchingData && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Report Results
                                </CardTitle>
                                <CardDescription>
                                    Generated on {new Date(reportData.generatedAt).toLocaleString()}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Summary Cards */}
                        {renderSummaryCards()}

                        {/* Tabs for Visualization and Table */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="visualization" className="flex items-center gap-2">
                                    <PieChartIcon className="h-4 w-4" />
                                    Visualization
                                </TabsTrigger>
                                <TabsTrigger value="table" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Data Table
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="visualization" className="mt-6">
                                {renderVisualization()}
                            </TabsContent>
                            <TabsContent value="table" className="mt-6">
                                <div className="rounded-md border overflow-x-auto max-h-[500px]">
                                    {renderDataTable()}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}