// Frontend/LivestockIQ/src/pages/regulator/FarmDetailsPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2,
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Users,
    Activity,
    AlertCircle,
    FileText,
    PawPrint,
    X,
    Wheat
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    getFarmDetails,
    getFarmAnimals,
    getFarmTreatments,
    getFarmCompliance,
    getFarmFeedBatches
} from '@/services/farmManagementService';
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
    const [feedBatches, setFeedBatches] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedViolation, setSelectedViolation] = useState(null);

    useEffect(() => {
        fetchFarmDetails();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'animals') fetchAnimals();
        if (activeTab === 'treatments') fetchTreatments();
        if (activeTab === 'compliance') fetchCompliance();
        if (activeTab === 'feed-batches') fetchFeedBatches();
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

    const fetchFeedBatches = async () => {
        try {
            const response = await getFarmFeedBatches(id, { page: 1, limit: 50 });
            setFeedBatches(response.data);
        } catch (error) {
            console.error('Error fetching feed batches:', error);
        }
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
                            <TabsTrigger value="feed-batches">
                                <Wheat className="w-4 h-4 mr-2" />
                                Feed Batches
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
                                                    <div
                                                        key={idx}
                                                        className="p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                                                        onClick={() => setSelectedViolation(violation)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-red-900">{violation.alertType}</p>
                                                                <p className="text-sm text-red-700 mt-1">{violation.message || 'No description available'}</p>
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

                        {/* Feed Batches Tab Content (inserted) */}
                        <TabsContent value="feed-batches" className="mt-0">
                            {feedBatches.length > 0 ? (
                                <div className="space-y-4">
                                    {feedBatches.map((batch, idx) => (
                                        <Card key={batch._id} className="border border-gray-200">
                                            <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <Wheat className="w-5 h-5 text-amber-600" />
                                                            {batch.feedId?.feedName || 'Unknown Feed'}
                                                        </CardTitle>
                                                        <p className="text-sm text-gray-600 mt-1">Batch #{idx + 1} • {batch.groupName || 'Unnamed Group'}</p>
                                                    </div>
                                                    <Badge className={
                                                        batch.status === 'Active' ? 'bg-green-500' :
                                                            batch.status === 'Completed' ? 'bg-blue-500' : 'bg-yellow-500'
                                                    }>
                                                        {batch.status}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500">Antimicrobial</p>
                                                        <p className="font-medium">{batch.feedId?.antimicrobialName || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500">Feed Quantity</p>
                                                        <p className="font-medium">{batch.feedQuantityUsed} kg</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500">Animals</p>
                                                        <p className="font-medium">{batch.numberOfAnimals}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500">Start Date</p>
                                                        <p className="font-medium">{format(new Date(batch.startDate), 'MMM dd, yyyy')}</p>
                                                    </div>
                                                </div>

                                                {batch.withdrawalEndDate && (
                                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                                                        <p className="text-sm font-medium text-yellow-900">Withdrawal Period Ends: {format(new Date(batch.withdrawalEndDate), 'MMM dd, yyyy')}</p>
                                                    </div>
                                                )}

                                                <div>
                                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                        <PawPrint className="w-4 h-4" />
                                                        Animals in this Batch ({batch.animals?.length || 0})
                                                    </h4>
                                                    {batch.animals?.length > 0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {batch.animals.map((animal) => (
                                                                <div key={animal._id} className="p-2 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="font-medium text-sm">{animal.tagId}</p>
                                                                            <p className="text-xs text-gray-600">{animal.name} • {animal.species}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No animal details available</p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No feed batch data available</p>
                            )}
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

            {/* Violation Details Dialog */}
            <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            MRL Violation Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedViolation && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-red-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">Alert Type</p>
                                    <p className="font-semibold text-red-900">{selectedViolation.alertType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Severity</p>
                                    <Badge variant="destructive" className="mt-1">{selectedViolation.severity}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <Badge className="mt-1">{selectedViolation.status || 'NEW'}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Risk Level</p>
                                    <Badge className={`mt-1 ${selectedViolation.riskLevel === 'IMMEDIATE_ACTION' ? 'bg-red-600' :
                                        selectedViolation.riskLevel === 'HIGH_PRIORITY' ? 'bg-orange-600' :
                                            'bg-yellow-600'
                                        }`}>{selectedViolation.riskLevel || 'MONITOR'}</Badge>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <h4 className="font-semibold mb-2">Description</h4>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {selectedViolation.message || 'No description available'}
                                </p>
                            </div>

                            {/* Violation Details */}
                            {selectedViolation.violationDetails && (
                                <div>
                                    <h4 className="font-semibold mb-3">Violation Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedViolation.violationDetails.animalName && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">Animal</p>
                                                <p className="font-medium">{selectedViolation.violationDetails.animalName}</p>
                                                {selectedViolation.violationDetails.animalId && (
                                                    <p className="text-xs text-gray-500 mt-1">ID: {selectedViolation.violationDetails.animalId}</p>
                                                )}
                                            </div>
                                        )}
                                        {selectedViolation.violationDetails.drugName && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">Drug</p>
                                                <p className="font-medium">{selectedViolation.violationDetails.drugName}</p>
                                                {selectedViolation.violationDetails.productType && (
                                                    <p className="text-xs text-gray-500 mt-1">Type: {selectedViolation.violationDetails.productType}</p>
                                                )}
                                            </div>
                                        )}
                                        {selectedViolation.violationDetails.residueLevel && (
                                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                <p className="text-sm text-gray-600">Residue Level</p>
                                                <p className="font-bold text-red-600">{selectedViolation.violationDetails.residueLevel} ppb</p>
                                                {selectedViolation.violationDetails.mrlLimit && (
                                                    <p className="text-xs text-gray-600 mt-1">Limit: {selectedViolation.violationDetails.mrlLimit} ppb</p>
                                                )}
                                            </div>
                                        )}
                                        {selectedViolation.violationDetails.exceededBy && (
                                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                <p className="text-sm text-gray-600">Exceeded By</p>
                                                <p className="font-bold text-red-600">{selectedViolation.violationDetails.exceededBy} ppb</p>
                                                {selectedViolation.violationDetails.percentageOver && (
                                                    <p className="text-xs text-red-600 mt-1">{selectedViolation.violationDetails.percentageOver}% over limit</p>
                                                )}
                                            </div>
                                        )}
                                        {selectedViolation.violationDetails.testDate && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">Test Date</p>
                                                <p className="font-medium">{format(new Date(selectedViolation.violationDetails.testDate), 'MMM dd, yyyy')}</p>
                                            </div>
                                        )}
                                        {selectedViolation.violationDetails.violationCount && (
                                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                <p className="text-sm text-gray-600">Violation Count</p>
                                                <p className="font-bold text-orange-600">{selectedViolation.violationDetails.violationCount} violations</p>
                                                {selectedViolation.violationDetails.timeWindow && (
                                                    <p className="text-xs text-gray-600 mt-1">in {selectedViolation.violationDetails.timeWindow}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div>
                                <h4 className="font-semibold mb-3">Timeline</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="text-sm text-gray-600">Created</span>
                                        <span className="font-medium">{format(new Date(selectedViolation.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                                    </div>
                                    {selectedViolation.acknowledgedAt && (
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Acknowledged</span>
                                            <span className="font-medium">{format(new Date(selectedViolation.acknowledgedAt), 'MMM dd, yyyy HH:mm')}</span>
                                        </div>
                                    )}
                                    {selectedViolation.resolvedAt && (
                                        <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                            <span className="text-sm text-gray-600">Resolved</span>
                                            <span className="font-medium text-green-600">{format(new Date(selectedViolation.resolvedAt), 'MMM dd, yyyy HH:mm')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {(selectedViolation.investigationNotes || selectedViolation.resolutionNotes) && (
                                <div>
                                    <h4 className="font-semibold mb-3">Notes</h4>
                                    <div className="space-y-2">
                                        {selectedViolation.investigationNotes && (
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm font-medium text-blue-900 mb-1">Investigation Notes</p>
                                                <p className="text-sm text-gray-700">{selectedViolation.investigationNotes}</p>
                                            </div>
                                        )}
                                        {selectedViolation.resolutionNotes && (
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <p className="text-sm font-medium text-green-900 mb-1">Resolution Notes</p>
                                                <p className="text-sm text-gray-700">{selectedViolation.resolutionNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FarmDetailsPage;
