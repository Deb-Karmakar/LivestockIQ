// Frontend/LivestockIQ/src/pages/regulator/PrescriptionsPage.jsx

import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, Sparkles, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getAllPrescriptions, getPrescriptionDetails, getPrescriptionStats } from '@/services/prescriptionReviewService';
import { format } from 'date-fns';

const AnimatedCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const end = parseInt(value) || 0;
        if (end === 0) return;
        const increment = end / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <span>{count.toLocaleString('en-IN')}</span>;
};

const PrescriptionsPage = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prescriptionsRes, statsRes] = await Promise.all([
                getAllPrescriptions({ page: 1, limit: 100 }),
                getPrescriptionStats()
            ]);
            setPrescriptions(prescriptionsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load prescriptions' });
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (prescription) => {
        try {
            const response = await getPrescriptionDetails(prescription._id);
            setSelectedPrescription(response.data);
            setShowDetails(true);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load prescription details' });
        }
    };

    const filteredPrescriptions = prescriptions.filter(p =>
        p.drugName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vetId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.farmerId?.farmName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading prescriptions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative">
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Prescription Review</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold mb-2">Prescription Audit</h1>
                    <p className="text-slate-400 max-w-2xl">Review and monitor all prescriptions issued across the system</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Prescriptions</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        <AnimatedCounter value={stats.overview.total} />
                                    </p>
                                </div>
                                <FileText className="w-12 h-12 text-blue-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">With Digital Signatures</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        <AnimatedCounter value={stats.overview.withDigitalSignatures} />
                                    </p>
                                </div>
                                <Shield className="w-12 h-12 text-green-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Signature Rate</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.overview.signatureRate}%</p>
                                </div>
                                <Shield className="w-12 h-12 text-purple-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search & Filter */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Search by drug name, vet, or farm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Prescriptions Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle>All Prescriptions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Farm</TableHead>
                                <TableHead>Veterinarian</TableHead>
                                <TableHead>Drug</TableHead>
                                <TableHead>Animal</TableHead>
                                <TableHead className="text-center">Signature</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPrescriptions.map((prescription) => (
                                <TableRow key={prescription._id} className="hover:bg-gray-50">
                                    <TableCell>{format(new Date(prescription.createdAt), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell className="font-medium">{prescription.farmerId?.farmName || 'N/A'}</TableCell>
                                    <TableCell>{prescription.vetId?.fullName || 'N/A'}</TableCell>
                                    <TableCell>{prescription.drugName}</TableCell>
                                    <TableCell>{prescription.animalId?.tagId || 'N/A'}</TableCell>
                                    <TableCell className="text-center">
                                        {prescription.digitalSignature ? (
                                            <Badge className="bg-green-500">
                                                <Shield className="w-3 h-3 mr-1" />
                                                Signed
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Not Signed</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDetails(prescription)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredPrescriptions.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No prescriptions found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Prescription Details</DialogTitle>
                    </DialogHeader>

                    {selectedPrescription && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Farm</p>
                                    <p className="font-medium">{selectedPrescription.farmerId?.farmName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Veterinarian</p>
                                    <p className="font-medium">{selectedPrescription.vetId?.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">License Number</p>
                                    <p className="font-medium">{selectedPrescription.vetId?.licenseNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Animal</p>
                                    <p className="font-medium">{selectedPrescription.animalId?.tagId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Drug Name</p>
                                    <p className="font-medium">{selectedPrescription.drugName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Dosage</p>
                                    <p className="font-medium">{selectedPrescription.dosage} {selectedPrescription.dosageUnit}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Diagnosis</p>
                                    <p className="font-medium">{selectedPrescription.diagnosis}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Instructions</p>
                                    <p className="font-medium">{selectedPrescription.instructions}</p>
                                </div>
                            </div>

                            {selectedPrescription.signatureVerification?.hasSignature && (
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-5 h-5 text-green-600" />
                                        <p className="font-semibold text-green-900">Digitally Signed</p>
                                    </div>
                                    <p className="text-sm text-green-700">
                                        Signed by {selectedPrescription.signatureVerification.signedBy} on{' '}
                                        {format(new Date(selectedPrescription.signatureVerification.signedAt), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PrescriptionsPage;
