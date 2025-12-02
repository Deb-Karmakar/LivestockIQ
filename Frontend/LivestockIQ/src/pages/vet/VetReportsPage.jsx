// Frontend/src/pages/vet/VetReportsPage.jsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    TrendingUp,
    TrendingDown,
    Stethoscope,
    Syringe,
    BarChart3,
    ShieldCheck,
    Building2
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
import { generateVetSignedLog } from '@/services/reportsService';
import {
    getVetPracticeOverviewData,
    getVetPrescriptionAnalyticsData,
    getVetFarmSupervisionData,
    getVetComplianceMonitoringData,
    getVetWhoAwareStewardshipData
} from '@/services/vetReportsService';
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

export default function VetReportsPage() {
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
            value: 'PracticeOverview',
            label: 'Practice Overview',
            icon: Stethoscope,
            desc: 'Overview of your practice statistics and activity'
        },
        {
            value: 'PrescriptionAnalytics',
            label: 'Prescription Analytics',
            icon: Syringe,
            desc: 'Prescription patterns and drug usage analysis'
        },
        {
            value: 'FarmSupervision',
            label: 'Farm Supervision',
            icon: Building2,
            desc: 'Status and statistics of supervised farms'
        },
        {
            value: 'WhoAwareStewardship',
            label: 'WHO AWaRe Stewardship',
            icon: Activity,
            desc: 'Responsible prescribing and drug class monitoring'
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
                case 'PracticeOverview':
                    dataResponse = await getVetPracticeOverviewData(fromDate, toDate);
                    break;
                case 'PrescriptionAnalytics':
                    dataResponse = await getVetPrescriptionAnalyticsData(fromDate, toDate);
                    break;
                case 'FarmSupervision':
                    dataResponse = await getVetFarmSupervisionData(fromDate, toDate);
                    break;
                case 'ComplianceMonitoring':
                    dataResponse = await getVetComplianceMonitoringData(fromDate, toDate);
                    break;
                case 'WhoAwareStewardship':
                    dataResponse = await getVetWhoAwareStewardshipData(fromDate, toDate);
                    break;
            }

            setReportData(dataResponse);
            setIsFetchingData(false);

            // Only generate PDF for signed log if user wants
            // For now, we'll skip auto-download and just show data

            toast({
                title: "Report Generated",
                description: "Report data loaded successfully."
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
                case 'PracticeOverview':
                    csvContent += 'Period,Prescriptions\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.name || 'N/A'}",${row.prescriptions || 0}\n`;
                    });
                    break;

                case 'PrescriptionAnalytics':
                    csvContent += 'Drug Name,Count\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.name || 'N/A'}",${row.count || 0}\n`;
                    });
                    break;

                case 'FarmSupervision':
                    csvContent += 'Farm Name,Farm Owner,Treatments,Alerts,Animals,AMU Intensity\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.farmName || ''}","${row.farmOwner || ''}",${row.treatments || 0},${row.alerts || 0},${row.animals || 0},${row.amuIntensity || 0}\n`;
                    });
                    break;

                case 'ComplianceMonitoring':
                    csvContent += 'Status,Count\n';
                    reportData.data.forEach(row => {
                        csvContent += `"${row.name || 'N/A'}",${row.value || 0}\n`;
                    });
                    break;

                case 'WhoAwareStewardship':
                    csvContent += 'Drug Class,Count\n';
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
            case 'PracticeOverview':
                cards.push(
                    { label: 'Supervised Farms', value: summary.supervisedFarms, icon: Building2 },
                    { label: 'Total Prescriptions', value: summary.totalPrescriptions, icon: Syringe },
                    { label: 'Approval Rate', value: `${summary.approvalRate}%`, icon: ShieldCheck, trend: summary.approvalRate >= 90 ? 'up' : 'down' },
                    { label: 'Feed Prescriptions', value: summary.feedPrescriptions, icon: Activity }
                );
                break;

            case 'PrescriptionAnalytics':
                cards.push(
                    { label: 'Total Prescriptions', value: summary.totalPrescriptions, icon: Syringe },
                    { label: 'Unique Drugs', value: summary.uniqueDrugs, icon: Activity },
                    { label: 'Species Treated', value: summary.speciesTreated, icon: Building2 },
                    { label: 'Access Group', value: summary.accessCount, icon: ShieldCheck }
                );
                break;

            case 'FarmSupervision':
                cards.push(
                    { label: 'Total Farms', value: summary.totalFarms, icon: Building2 },
                    { label: 'Total Treatments', value: summary.totalTreatments, icon: Syringe },
                    { label: 'Total Alerts', value: summary.totalAlerts, icon: Activity },
                    { label: 'Farms with Alerts', value: summary.farmsWithAlerts, icon: TrendingDown }
                );
                break;

            case 'ComplianceMonitoring':
                cards.push(
                    { label: 'Total Reviews', value: summary.totalReviews, icon: Activity },
                    { label: 'Approved', value: summary.approved, icon: ShieldCheck },
                    { label: 'Rejected', value: summary.rejected, icon: TrendingDown },
                    { label: 'Approval Rate', value: `${summary.approvalRate}%`, icon: TrendingUp, trend: summary.approvalRate >= 90 ? 'up' : 'down' }
                );
                break;

            case 'WhoAwareStewardship':
                cards.push(
                    { label: 'Access Group', value: summary.accessCount, icon: ShieldCheck },
                    { label: 'Watch Group', value: summary.watchCount, icon: Activity },
                    { label: 'Reserve Group', value: summary.reserveCount, icon: TrendingDown },
                    { label: 'Stewardship Score', value: `${summary.stewardshipScore}%`, icon: TrendingUp, trend: summary.stewardshipScore >= 80 ? 'up' : 'down' }
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
                    <p>No data available for this report</p>
                </div>
            );
        }

        switch (reportData.reportType) {
            case 'PracticeOverview':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="prescriptions" stroke="#3b82f6" strokeWidth={2} name="Prescriptions" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'PrescriptionAnalytics':
                return (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-semibold mb-4">Top Prescribed Drugs</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="count" fill="#3b82f6" name="Prescriptions" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {reportData.drugClassBreakdown && reportData.drugClassBreakdown.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-4">WHO AWaRe Classification</h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={reportData.drugClassBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {reportData.drugClassBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                );

            case 'FarmSupervision':
                // Show a table view for farms
                return (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>View detailed farm supervision data in the Data Table tab</p>
                    </div>
                );

            case 'ComplianceMonitoring':
            case 'WhoAwareStewardship':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={reportData.data}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {reportData.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
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
                    {reportData.data.slice(0, 100).map((row, index) => (
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
                            <span>Practice Reports</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Reports & Analytics
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Generate comprehensive practice reports with data visualizations and export capabilities.
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
                        Select a report type and date range to generate your practice report
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

                    {/* Date Range */}
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
                            disabled={isGenerating || !selectedReportType}
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
                                    Generate Report
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

            {/* Loading State */}
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

            {/* Report Results */}
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