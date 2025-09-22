import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
// CORRECTED: The path now points to the correct 'hooks' folder.
import { useToast } from '../../../client/src/hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, Users, ShieldAlert, CheckCircle2, Copy, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Mock Data ---
const vetStats = [
    { title: "Pending Reviews", value: "2", icon: <ClipboardList className="h-6 w-6 text-orange-500" />, color: "bg-orange-100" },
    { title: "Active Farm Alerts", value: "3", icon: <ShieldAlert className="h-6 w-6 text-red-500" />, color: "bg-red-100" },
    { title: "Assigned Farmers", value: "12", icon: <Users className="h-6 w-6 text-blue-500" />, color: "bg-blue-100" },
];
const highPriorityRequests = [
    { id: 'TMT-004', farmerName: 'Sunita Devi', animalId: 'C-203', drugName: 'Tylosin' },
    { id: 'TMT-005', farmerName: 'Rahul Sharma', animalId: '342987123456', drugName: 'Painkiller' },
];

// --- Main Vet Dashboard Page Component ---
const VetDashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const handleCopyToClipboard = () => {
        if (user?.vetId) {
            navigator.clipboard.writeText(user.vetId);
            toast({
                title: "Copied to Clipboard!",
                description: `Your Vet ID (${user.vetId}) is now ready to be shared.`,
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name || 'Doctor'}!</h1>
                <p className="mt-1 text-gray-600">Here's a summary of your key tasks and farm compliance.</p>
            </div>

            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Unique Vet ID</CardTitle>
                        <CardDescription>Share this code with farmers so they can register under your supervision.</CardDescription>
                    </div>
                     <Share2 className="w-6 h-6 text-blue-600" />
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <p className="text-2xl md:text-3xl font-mono font-bold text-blue-800 tracking-widest bg-white p-3 rounded-md flex-grow">
                        {user?.vetId || 'Loading...'}
                    </p>
                    <Button onClick={handleCopyToClipboard}>
                        <Copy className="mr-2 h-4 w-4" /> Copy ID
                    </Button>
                </CardContent>
            </Card>

            {/* Key Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vetStats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-full ${stat.color}`}>{stat.icon}</div>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stat.value}</div></CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                {/* High Priority Requests */}
                <Card>
                    <CardHeader>
                        <CardTitle>High-Priority Reviews</CardTitle>
                        <CardDescription>These treatments require your immediate attention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Farmer</TableHead>
                                    <TableHead>Animal ID</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {highPriorityRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.farmerName}</TableCell>
                                        <TableCell>{req.animalId}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => navigate('/vet/requests')}>Review</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Overall Compliance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Farm Compliance</CardTitle>
                        <CardDescription>Compliance rate across all your assigned farms.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-4xl font-bold text-green-600">96%</span>
                            <CheckCircle2 className="w-12 h-12 text-green-200" />
                        </div>
                        <Progress value={96} className="w-full" />
                        <p className="text-xs text-gray-500">
                            Based on timely withdrawal adherence and signed treatment records.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VetDashboardPage;