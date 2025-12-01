// Frontend/LivestockIQ/src/pages/regulator/FarmDetailsPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, MapPin, Phone, Mail, Users, Activity, AlertCircle, FileText, PawPrint } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getFarmDetails, getFarmAnimals, getFarmTreatments, getFarmCompliance } from '@/services/farmManagementService';
import { format } from 'date-fns';

const FarmDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [farmData, setFarmData] = useState(null);
    const [animals, setAnimals] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [compliance, setCompliance] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchFarmDetails();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'animals') fetchAnimals();
        if (activeTab === 'treatments') fetchTreatments();
        if (activeTab === 'compliance') fetchCompliance();
    }, [activeTab]);

    const fetchFarmDetails = async () => {
        try {
            setLoading(true);
            const response = await getFarmDetails(id);
            setFarmData(response.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load farm details' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAnimals = async () => {
        try {
            const response = await getFarmAnimals(id, { page: 1, limit: 50 });
            setAnimals(response.data);
        } catch (error) {
            console.error('Error fetching animals:', error);
        }
    };

    const fetchTreatments = async () => {
        try {
            const response = await getFarmTreatments(id, { page: 1, limit: 50 });
            setTreatments(response.data);
        } catch (error) {
            console.error('Error fetching treatments:', error);
        }
    };

    const fetchCompliance = async () => {
        try {
            const response = await getFarmCompliance(id);
            setCompliance(response.data);
        } catch (error) {
            console.error('Error fetching compliance:', error);
        }
    };

    const getMRLBadge = (status) => {
        const badges = {
            'SAFE': <Badge className="bg-green-500">Safe</Badge>,
            'WITHDRAWAL_ACTIVE': <Badge className="bg-yellow-500">Withdrawal</Badge>,
            'TEST_REQUIRED': <Badge className="bg-orange-500">Test Required</Badge>,
            'PENDING_VERIFICATION': <Badge className="bg-blue-500">Pending</Badge>,
            'VIOLATION': <Badge variant="destructive">Violation</Badge>
        };
        return badges[status] || <Badge>Unknown</Badge>;
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Pending': <Badge className="bg-yellow-500">Pending</Badge>,
            'Approved': <Badge className="bg-green-500">Approved</Badge>,
            'Rejected': <Badge variant="destructive">Rejected</Badge>,
            'Completed': <Badge className="bg-blue-500">Completed</Badge>
        };
        return badges[status] || <Badge>{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading farm details...</p>
            </div>
        );
    }

    if (!farmData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Farm not found</p>
                <Button onClick={() => navigate('/regulator/farms')} className="mt-4">Back to Farms</Button>
            </div>
        );
    }

    const { farm, veterinarian, statistics } = farmData;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/regulator/farms')}
                        className="text-white hover:bg-white/10 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Farms
                    </Button>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
                                <Building2 className="w-10 h-10" />
                                {farm.farmName}
                            </h1>
                            <p className="text-slate-400 text-lg">{farm.farmOwner}</p>
                        </div>
                        <Badge className={farm.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>
                            {farm.status}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium truncate">{farm.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm font-medium">{farm.phoneNumber || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-xs text-gray-500">Species</p>
                                <p className="text-sm font-medium">{farm.speciesReared || 'Mixed'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="text-xs text-gray-500">Herd Size</p>
                                <p className="text-sm font-medium">{farm.herdSize || statistics.animals.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Animals</p>
                        <p className="text-3xl font-bold text-blue-600">{statistics.animals.total}</p>
                        <p className="text-xs text-gray-500 mt-1">{statistics.animals.active} active</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Treatments</p>
                        <p className="text-3xl font-bold text-green-600">{statistics.treatments.total}</p>
                        <p className="text-xs text-gray-500 mt-1">{statistics.treatments.active} active</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Alerts</p>
                        <p className="text-3xl font-bold text-orange-600">{statistics.alerts.active}</p>
                        <p className="text-xs text-gray-500 mt-1">{statistics.alerts.total} total</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Compliance Rate</p>
                        <p className="text-3xl font-bold text-purple-600">{statistics.complianceRate}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Veterinarian Info */}
            {veterinarian && (
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <CardTitle>Supervising Veterinarian</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">{veterinarian.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{veterinarian.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">License Number</p>
                                <p className="font-medium">{veterinarian.licenseNumber}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Card className="border-0 shadow-lg">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="animals">
                                <PawPrint className="w-4 h-4 mr-2" />
                                Animals
                            </TabsTrigger>
                            <TabsTrigger value="treatments">
                                <Activity className="w-4 h-4 mr-2" />
                                Treatments
                            </TabsTrigger>
                            <TabsTrigger value="compliance">
                                <FileText className="w-4 h-4 mr-2" />
                                Compliance
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    <CardContent className="p-6">
                        <TabsContent value="animals" className="mt-0">
                            {animals.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tag ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Species</TableHead>
                                            <TableHead>Gender</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {animals.map((animal) => (
                                            <TableRow key={animal._id}>
                                                <TableCell className="font-medium">{animal.tagId}</TableCell>
                                                <TableCell>{animal.name}</TableCell>
                                                <TableCell>{animal.species}</TableCell>
                                                <TableCell>{animal.gender}</TableCell>
                                                <TableCell>
                                                    <Badge className={animal.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>
                                                        {animal.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No animals data available</p>
                            )}
                        </TabsContent>

                        <TabsContent value="treatments" className="mt-0">
                            {treatments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Animal</TableHead>
                                            <TableHead>Drug</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {treatments.map((treatment) => (
                                            <TableRow key={treatment._id}>
                                                <TableCell className="font-medium">
                                                    {treatment.animalId || 'N/A'}
                                                </TableCell>
                                                <TableCell>{treatment.drugName}</TableCell>
                                                <TableCell>{format(new Date(treatment.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell>{getStatusBadge(treatment.status)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No treatments data available</p>
                            )}
                        </TabsContent>

                        <TabsContent value="compliance" className="mt-0">
                            {compliance ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-sm text-gray-500">Compliance Rate</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {compliance.complianceMetrics.complianceRate}%
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-sm text-gray-500">Total Alerts</p>
                                                <p className="text-2xl font-bold">{compliance.complianceMetrics.totalAlerts}</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-sm text-gray-500">Resolved</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {compliance.complianceMetrics.resolvedAlerts}
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-sm text-gray-500">Active Violations</p>
                                                <p className="text-2xl font-bold text-red-600">
                                                    {compliance.complianceMetrics.activeViolations}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {compliance.recentViolations?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-3">Recent Violations</h3>
                                            <div className="space-y-2">
                                                {compliance.recentViolations.map((violation, idx) => (
                                                    <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-red-900">{violation.alertType}</p>
                                                                <p className="text-sm text-red-700 mt-1">{violation.description}</p>
                                                            </div>
                                                            <Badge variant="destructive">{violation.severity}</Badge>
                                                        </div>
                                                        <p className="text-xs text-red-600 mt-2">
                                                            {format(new Date(violation.createdAt), 'MMM dd, yyyy HH:mm')}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Loading compliance data...</p>
                            )}
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
};

export default FarmDetailsPage;
