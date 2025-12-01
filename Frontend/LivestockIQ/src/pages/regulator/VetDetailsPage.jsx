// Frontend/LivestockIQ/src/pages/regulator/VetDetailsPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowLeft, Mail, Phone, GraduationCap, Building2, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getVetDetails, getVetFarms, getVetPrescriptions, getVetCompliance } from '@/services/vetManagementService';
import { format } from 'date-fns';

const VetDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [vetData, setVetData] = useState(null);
    const [farms, setFarms] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [compliance, setCompliance] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchVetDetails();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'farms') fetchFarms();
        if (activeTab === 'prescriptions') fetchPrescriptions();
        if (activeTab === 'compliance') fetchCompliance();
    }, [activeTab]);

    const fetchVetDetails = async () => {
        try {
            setLoading(true);
            const response = await getVetDetails(id);
            setVetData(response.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load vet details' });
        } finally {
            setLoading(false);
        }
    };

    const fetchFarms = async () => {
        try {
            const response = await getVetFarms(id, { page: 1, limit: 50 });
            setFarms(response.data);
        } catch (error) {
            console.error('Error fetching farms:', error);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const response = await getVetPrescriptions(id, { page: 1, limit: 50 });
            setPrescriptions(response.data);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        }
    };

    const fetchCompliance = async () => {
        try {
            const response = await getVetCompliance(id);
            setCompliance(response.data);
        } catch (error) {
            console.error('Error fetching compliance:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading veterinarian details...</p>
            </div>
        );
    }

    if (!vetData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Veterinarian not found</p>
                <Button onClick={() => navigate('/regulator/vets')} className="mt-4">Back to Vets</Button>
            </div>
        );
    }

    const { vet, statistics, recentPrescriptions } = vetData;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="relative">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/regulator/vets')}
                        className="text-white hover:bg-white/10 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Vets
                    </Button>

                    <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
                        <Stethoscope className="w-10 h-10" />
                        {vet.fullName}
                    </h1>
                    <p className="text-slate-400 text-lg">{vet.licenseNumber}</p>
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
                                <p className="text-sm font-medium truncate">{vet.email}</p>
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
                                <p className="text-sm font-medium">{vet.phoneNumber || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-xs text-gray-500">Specialization</p>
                                <p className="text-sm font-medium">{vet.specialization || 'General'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="text-xs text-gray-500">University</p>
                                <p className="text-sm font-medium truncate">{vet.university || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Farms</p>
                        <p className="text-3xl font-bold text-blue-600">{statistics.farms}</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Prescriptions</p>
                        <p className="text-3xl font-bold text-green-600">{statistics.prescriptions.total}</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Treatments</p>
                        <p className="text-3xl font-bold text-orange-600">{statistics.treatments.total}</p>
                        <p className="text-xs text-gray-500 mt-1">{statistics.treatments.approved} approved</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Approval Rate</p>
                        <p className="text-3xl font-bold text-purple-600">{statistics.treatments.approvalRate}%</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600 mb-1">Compliance</p>
                        <p className="text-3xl font-bold text-pink-600">{statistics.complianceRate}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Card className="border-0 shadow-lg">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="farms">
                                <Building2 className="w-4 h-4 mr-2" />
                                Farms
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    <CardContent className="p-6">
                        <TabsContent value="farms" className="mt-0">
                            {farms.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {farms.map((farm) => (
                                        <Card
                                            key={farm._id}
                                            className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => navigate(`/regulator/farms/${farm._id}`)}
                                        >
                                            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                    {farm.farmName}
                                                </CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">{farm.farmOwner}</p>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Species:</span>
                                                    <span className="font-medium">{farm.speciesReared || 'Mixed'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Animals:</span>
                                                    <span className="font-medium">{farm.statistics?.totalAnimals || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Active Treatments:</span>
                                                    <Badge variant="outline">{farm.statistics?.activeTreatments || 0}</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No farms under supervision</p>
                            )}
                        </TabsContent>

                        <TabsContent value="prescriptions" className="mt-0">
                            {prescriptions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Farm</TableHead>
                                            <TableHead>Animal</TableHead>
                                            <TableHead>Drug</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {prescriptions.map((prescription) => (
                                            <TableRow key={prescription._id}>
                                                <TableCell className="font-medium">{prescription.farmerId?.farmName || 'N/A'}</TableCell>
                                                <TableCell>{prescription.animalId?.tagId || 'N/A'}</TableCell>
                                                <TableCell>{prescription.drugName}</TableCell>
                                                <TableCell>{format(new Date(prescription.createdAt), 'MMM dd, yyyy')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No prescriptions data available</p>
                            )}
                        </TabsContent>

                        <TabsContent value="compliance" className="mt-0">
                            {compliance ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-sm text-gray-500">Compliance Rate</p>
                                                <p className="text-2xl font-bold text-green-600">{compliance.complianceMetrics.complianceRate}%</p>
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
                                                <p className="text-2xl font-bold text-green-600">{compliance.complianceMetrics.resolvedAlerts}</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-sm text-gray-500">Active</p>
                                                <p className="text-2xl font-bold text-orange-600">{compliance.complianceMetrics.activeAlerts}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
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

export default VetDetailsPage;
