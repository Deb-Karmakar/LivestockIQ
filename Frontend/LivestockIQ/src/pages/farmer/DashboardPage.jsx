import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '../../contexts/AuthContext'; // Corrected import path
import { PlusCircle, Syringe, Bell, ShieldCheck, FileText, Package, BarChartHorizontalBig } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- Mock Data ---
const herdHealthData = [
  { name: 'Healthy', value: 47, color: '#22c55e' },
  { name: 'Under Treatment', value: 3, color: '#f97316' },
  { name: 'Needs Attention', value: 1, color: '#ef4444' },
];

const alerts = [
    { id: 1, severity: "destructive", title: "Withdrawal Period Ending Soon", description: "Cow #C-012 (Enrofloxacin) - Safe in 2 days." },
    { id: 2, severity: "warning", title: "Low Drug Inventory", description: "Amoxicillin stock is low. Only 5 units left." },
    { id: 3, severity: "default", title: "New Prescription Added", description: "Dr. Sharma has uploaded a new prescription for Herd B." },
];

const recentActivity = [
    { id: "C-012", task: "Administered Enrofloxacin", type: "Treatment", date: "2 days ago" },
    { id: "Batch-5", task: "Started Medicated Feed", type: "Feed", date: "3 days ago" },
    { id: "B-089", task: "Completed Amoxicillin course", type: "Treatment", date: "5 days ago" },
];

// --- Dashboard Component ---

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // 2. Initialize the navigate function

  // 3. Create a handler to navigate to the treatments page
  const handleAddTreatmentClick = () => {
    navigate('/farmer/treatments');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hello, {user?.farmOwner || 'Farmer'}!</h1>
          <p className="mt-1 text-gray-600">Welcome back to your farm dashboard.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
            {/* 4. Attach the onClick handler to the button */}
            <Button onClick={handleAddTreatmentClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Treatment
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" /> Generate Report
            </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            {/* Herd Health Overview Card with Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChartHorizontalBig className="w-6 h-6 text-green-600" />
                        <span>Herd Health Overview</span>
                    </CardTitle>
                    <CardDescription>A real-time snapshot of your herd's health status.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={herdHealthData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}>
                                    {herdHealthData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} Animals`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                        {herdHealthData.map(item => (
                            <div key={item.name} className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                <span className="ml-auto text-sm font-semibold">{item.value} Animals</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Farm Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Animal/Batch ID</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentActivity.map((activity) => (
                                <TableRow key={activity.id}>
                                    <TableCell className="font-medium">{activity.id}</TableCell>
                                    <TableCell>{activity.task}</TableCell>
                                    <TableCell>
                                        <Badge variant={activity.type === 'Treatment' ? 'default' : 'secondary'}>{activity.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-gray-500">{activity.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
            {/* Urgent Alerts Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-red-500" />
                        <span>Urgent Alerts</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {alerts.map(alert => (
                        <Alert key={alert.id} variant={alert.severity}>
                            <AlertTitle className="font-semibold">{alert.title}</AlertTitle>
                            <AlertDescription>{alert.description}</AlertDescription>
                        </Alert>
                    ))}
                </CardContent>
            </Card>
            {/* Key Stats Card */}
             <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        <span>Quick Stats</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Treatments</span>
                        <span className="font-bold text-lg">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Animals Safe for Sale</span>
                        <span className="font-bold text-lg text-green-600">47</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-gray-600">Prescriptions to Review</span>
                        <span className="font-bold text-lg">1</span>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;

