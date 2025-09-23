import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// UPDATED: Added 'ShieldCheck' to the import list
import { TrendingUp, ShieldX, Clock, Tractor, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Mock Data (to be replaced by API calls later) ---
const mockComplianceStats = {
    complianceRate: 97.5,
    pendingVerifications: 78,
    overdueVerifications: 12,
    farmsFlagged: 4,
};
const mockComplianceTrend = [
    { month: 'Apr', overdue: 25 },
    { month: 'May', overdue: 22 },
    { month: 'Jun', overdue: 18 },
    { month: 'Jul', overdue: 20 },
    { month: 'Aug', overdue: 15 },
    { month: 'Sep', overdue: 12 },
];
const mockAlerts = [
    { id: 1, farmName: 'Sunrise Dairy', vetName: 'Dr. A. Sharma', issue: 'Overdue Treatment Verification (>14 days)', date: '2025-09-21', severity: 'High' },
    { id: 2, farmName: 'Green Valley Farms', vetName: 'Dr. R. Gupta', issue: 'Unusual Spike in Antibiotic Use', date: '2025-09-20', severity: 'High' },
    { id: 3, farmName: 'Himalayan Goats Co.', vetName: 'Dr. P. Verma', issue: 'Overdue Treatment Verification (>7 days)', date: '2025-09-18', severity: 'Medium' },
    { id: 4, farmName: 'Coastal Cattle Ranch', vetName: 'Dr. A. Sharma', issue: 'Incomplete Treatment Record Submitted', date: '2025-09-17', severity: 'Low' },
];

// --- Helper Components ---
const SeverityBadge = ({ severity }) => {
    const styles = {
        High: 'bg-red-100 text-red-800',
        Medium: 'bg-amber-100 text-amber-800',
        Low: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={`${styles[severity]} hover:${styles[severity]}`}>{severity}</Badge>;
};

// --- Main Compliance Page Component ---
const CompliancePage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Compliance Monitoring</h1>
                <p className="mt-1 text-gray-600">Track policy adherence and view non-compliance alerts across the region.</p>
            </div>

            {/* Section 1: Policy Dashboard - Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Compliance Rate</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{mockComplianceStats.complianceRate}%</div>
                        <p className="text-xs text-muted-foreground">Based on all verified records</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockComplianceStats.pendingVerifications}</div>
                        <p className="text-xs text-muted-foreground">Treatments awaiting vet signature</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Verifications</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{mockComplianceStats.overdueVerifications}</div>
                        <p className="text-xs text-muted-foreground">Pending for over 7 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Farms Flagged</CardTitle>
                        <Tractor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{mockComplianceStats.farmsFlagged}</div>
                        <p className="text-xs text-muted-foreground">With high-severity alerts</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {/* Section 2: Trend Analysis Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <TrendingUp className="w-5 h-5" />
                             Overdue Verifications Trend
                        </CardTitle>
                        <CardDescription>Number of overdue treatment records in the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockComplianceTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Section 3: Non-Compliance Alerts Table */}
                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldX className="w-5 h-5" />
                            Non-Compliance Alerts
                        </CardTitle>
                        <CardDescription>A list of specific flags requiring attention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Farm</TableHead>
                                    <TableHead>Issue</TableHead>
                                    <TableHead>Severity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockAlerts.map(alert => (
                                    <TableRow key={alert.id}>
                                        <TableCell className="font-medium">{alert.farmName}</TableCell>
                                        <TableCell>{alert.issue}</TableCell>
                                        <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CompliancePage;