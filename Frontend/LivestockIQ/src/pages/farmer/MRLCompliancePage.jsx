// Frontend/LivestockIQ/src/pages/farmer/MRLCompliancePage.jsx

import { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Upload,
    FileText,
    Calendar,
    TrendingUp,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { getAnimalMRLStatus, getPendingMRLTests, submitLabTest, getLabTestHistory } from '@/services/mrlService';
import { getAnimals } from '@/services/animalService';
import { format } from 'date-fns';

const MRLCompliancePage = () => {
    const [animals, setAnimals] = useState([]);
    const [mrlStatuses, setMRLStatuses] = useState({});
    const [pendingTests, setPendingTests] = useState([]);
    const [testHistory, setTestHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Lab test form state
    const [testForm, setTestForm] = useState({
        animalId: '',
        treatmentId: '',
        drugName: '',
        sampleType: 'Milk',
        productType: 'Milk',
        residueLevelDetected: '',
        unit: 'µg/kg',
        testDate: '',
        labName: '',
        labLocation: '',
        labCertificationNumber: '',
        testReportNumber: '',
        certificateUrl: '',
        testedBy: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all animals
            const animalsData = await getAnimals();
            setAnimals(animalsData.data || animalsData || []);

            // Fetch pending MRL tests
            const pendingData = await getPendingMRLTests();
            setPendingTests(pendingData.data || []);

            // Fetch test history
            const historyData = await getLabTestHistory();
            setTestHistory(historyData.data || []);

            // Fetch MRL status for each animal
            const animalsList = animalsData.data || animalsData || [];
            const statusPromises = animalsList.map(animal =>
                getAnimalMRLStatus(animal.tagId).catch(() => null)
            );
            const allStatuses = await Promise.all(statusPromises);

            const statusMap = {};
            animalsList.forEach((animal, index) => {
                if (allStatuses[index]) {
                    statusMap[animal.tagId] = allStatuses[index];
                }
            });
            setMRLStatuses(statusMap);

        } catch (error) {
            console.error('Error fetching MRL data:', error);
            toast.error('Failed to load MRL compliance data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUploadDialog = (animal = null) => {
        setSelectedAnimal(animal);
        if (animal) {
            setTestForm(prev => ({
                ...prev,
                animalId: animal.tagId
            }));
        }
        setUploadDialogOpen(true);
    };

    const handleSubmitLabTest = async (e) => {
        e.preventDefault();

        try {
            const result = await submitLabTest({
                ...testForm,
                residueLevelDetected: parseFloat(testForm.residueLevelDetected)
            });

            toast.success(result.message || 'Lab test submitted successfully');
            setUploadDialogOpen(false);

            // Reset form
            setTestForm({
                animalId: '',
                treatmentId: '',
                drugName: '',
                sampleType: 'Milk',
                productType: 'Milk',
                residueLevelDetected: '',
                unit: 'µg/kg',
                testDate: '',
                labName: '',
                labLocation: '',
                labCertificationNumber: '',
                testReportNumber: '',
                certificateUrl: '',
                testedBy: '',
                notes: ''
            });

            // Refresh data
            fetchData();

        } catch (error) {
            console.error('Error submitting lab test:', error);
            toast.error(error.response?.data?.message || 'Failed to submit lab test');
        }
    };

    const getMRLStatusBadge = (status) => {
        switch (status?.mrlStatus) {
            case 'SAFE':
                // Check if regulator approved or still pending
                const isPendingVerification = status?.statusMessage?.includes('pending');
                return (
                    <div className="flex flex-col items-start gap-1">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Safe for Sale
                        </Badge>
                        {isPendingVerification && (
                            <span className="text-xs text-gray-500 italic">Pending Verification</span>
                        )}
                    </div>
                );
            case 'TEST_REQUIRED':
                return (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        Test Required
                    </Badge>
                );
            case 'VIOLATION':
                return (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white">
                        <XCircle className="w-3 h-3 mr-1" />
                        MRL Violation
                    </Badge>
                );
            case 'WITHDRAWAL_ACTIVE':
                return (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Under Withdrawal
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        No Recent Treatments
                    </Badge>
                );
        }
    };

    const safeAnimals = animals.filter(a => mrlStatuses[a.tagId]?.canSellProducts);
    const violationCount = Object.values(mrlStatuses).filter(s => s.mrlStatus === 'VIOLATION').length;
    const testsRequired = Object.values(mrlStatuses).filter(s => s.mrlStatus === 'TEST_REQUIRED').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading MRL compliance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-8 h-8" />
                            <h1 className="text-3xl font-bold">MRL Compliance Dashboard</h1>
                        </div>
                        <p className="text-green-50">
                            Monitor Maximum Residue Limits and ensure safe product sales
                        </p>
                    </div>
                    <Button
                        onClick={() => handleOpenUploadDialog()}
                        className="bg-white text-green-600 hover:bg-green-50"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Lab Test
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Safe for Sale</p>
                                <p className="text-2xl font-bold text-green-600">{safeAnimals.length}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tests Required</p>
                                <p className="text-2xl font-bold text-yellow-600">{testsRequired}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">MRL Violations</p>
                                <p className="text-2xl font-bold text-red-600">{violationCount}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Tests</p>
                                <p className="text-2xl font-bold text-blue-600">{pendingTests.length}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Animal Status</TabsTrigger>
                    <TabsTrigger value="pending">Pending Tests ({pendingTests.length})</TabsTrigger>
                    <TabsTrigger value="history">Test History</TabsTrigger>
                </TabsList>

                {/* Animal Status Tab */}
                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>Animal MRL Compliance Status</CardTitle>
                            <CardDescription>
                                View MRL compliance status for all animals on your farm
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Animal ID</th>
                                            <th className="text-left p-3">Name</th>
                                            <th className="text-left p-3">Species</th>
                                            <th className="text-left p-3">MRL Status</th>
                                            <th className="text-left p-3">Can Sell?</th>
                                            <th className="text-left p-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {animals.map((animal) => {
                                            const status = mrlStatuses[animal.tagId];
                                            return (
                                                <tr key={animal.tagId} className="border-b hover:bg-gray-50">
                                                    <td className="p-3 font-mono text-sm">{animal.tagId}</td>
                                                    <td className="p-3 font-medium">{animal.name}</td>
                                                    <td className="p-3">{animal.species}</td>
                                                    <td className="p-3">{getMRLStatusBadge(status)}</td>
                                                    <td className="p-3">
                                                        {status?.canSellProducts ? (
                                                            <span className="text-green-600 font-medium">✓ Yes</span>
                                                        ) : (
                                                            <span className="text-red-600 font-medium">✗ No</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenUploadDialog(animal)}
                                                        >
                                                            Upload Test
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pending Tests Tab */}
                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Animals Needing MRL Testing</CardTitle>
                            <CardDescription>
                                These animals have completed withdrawal periods but lack MRL test results
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingTests.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-900">All Caught Up!</p>
                                    <p className="text-gray-600">No animals are pending MRL testing</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingTests.map((item) => (
                                        <div key={item.animalId} className="border rounded-lg p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{item.animalName}</p>
                                                <p className="text-sm text-gray-600">
                                                    ID: {item.animalId} • {item.species}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {item.treatmentsCount} treatment(s) • Last treated: {format(new Date(item.lastTreatmentDate), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => handleOpenUploadDialog(animals.find(a => a.tagId === item.animalId))}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Test
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Test History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lab Test History</CardTitle>
                            <CardDescription>
                                Complete history of all MRL tests submitted
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {testHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-900">No Test History</p>
                                    <p className="text-gray-600">Upload your first lab test to see results here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {testHistory.map((test) => (
                                        <div key={test._id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{test.animalId}</p>
                                                    {test.isPassed ? (
                                                        <Badge className="bg-green-500">Passed</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-500">Failed</Badge>
                                                    )}
                                                    <Badge variant="outline">{test.status}</Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">{format(new Date(test.testDate), 'MMM dd, yyyy')}</p>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                                                <div>
                                                    <p className="text-gray-600">Drug</p>
                                                    <p className="font-medium">{test.drugName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Sample Type</p>
                                                    <p className="font-medium">{test.sampleType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Residue Level</p>
                                                    <p className={`font-medium ${test.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                                        {test.residueLevelDetected} {test.unit}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">MRL Threshold</p>
                                                    <p className="font-medium">{test.mrlThreshold} {test.unit}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">Lab: {test.labName} • Report: {test.testReportNumber}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Lab Test Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Upload MRL Lab Test Result</DialogTitle>
                        <DialogDescription>
                            Submit laboratory test results for MRL compliance verification
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitLabTest}>
                        <div className="grid gap-4 py-4">
                            {/* Animal Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="animalId">Animal ID *</Label>
                                    <Select
                                        value={testForm.animalId}
                                        onValueChange={(value) => setTestForm({ ...testForm, animalId: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select animal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {animals.map((animal) => (
                                                <SelectItem key={animal.tagId} value={animal.tagId}>
                                                    {animal.name} ({animal.tagId})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="drugName">Drug Name *</Label>
                                    <Input
                                        id="drugName"
                                        value={testForm.drugName}
                                        onChange={(e) => setTestForm({ ...testForm, drugName: e.target.value })}
                                        placeholder="e.g., Oxytetracycline"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Sample Type and Product Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="sampleType">Sample Type *</Label>
                                    <Select
                                        value={testForm.sampleType}
                                        onValueChange={(value) => setTestForm({ ...testForm, sampleType: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Milk">Milk</SelectItem>
                                            <SelectItem value="Blood">Blood</SelectItem>
                                            <SelectItem value="Meat">Meat</SelectItem>
                                            <SelectItem value="Tissue">Tissue</SelectItem>
                                            <SelectItem value="Urine">Urine</SelectItem>
                                            <SelectItem value="Eggs">Eggs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="productType">Product Type *</Label>
                                    <Select
                                        value={testForm.productType}
                                        onValueChange={(value) => setTestForm({ ...testForm, productType: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Milk">Milk</SelectItem>
                                            <SelectItem value="Meat">Meat</SelectItem>
                                            <SelectItem value="Eggs">Eggs</SelectItem>
                                            <SelectItem value="Honey">Honey</SelectItem>
                                            <SelectItem value="Fish">Fish</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Residue Level */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="residueLevelDetected">Residue Level Detected *</Label>
                                    <Input
                                        id="residueLevelDetected"
                                        type="number"
                                        step="0.01"
                                        value={testForm.residueLevelDetected}
                                        onChange={(e) => setTestForm({ ...testForm, residueLevelDetected: e.target.value })}
                                        placeholder="e.g., 50.5"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="unit">Unit *</Label>
                                    <Select
                                        value={testForm.unit}
                                        onValueChange={(value) => setTestForm({ ...testForm, unit: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="µg/kg">µg/kg</SelectItem>
                                            <SelectItem value="ppb">ppb</SelectItem>
                                            <SelectItem value="mg/kg">mg/kg</SelectItem>
                                            <SelectItem value="ppm">ppm</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Lab Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="labName">Laboratory Name *</Label>
                                    <Input
                                        id="labName"
                                        value={testForm.labName}
                                        onChange={(e) => setTestForm({ ...testForm, labName: e.target.value })}
                                        placeholder="e.g., National MRL Testing Lab"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="labLocation">Lab Location</Label>
                                    <Input
                                        id="labLocation"
                                        value={testForm.labLocation}
                                        onChange={(e) => setTestForm({ ...testForm, labLocation: e.target.value })}
                                        placeholder="e.g., Mumbai, Maharashtra"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="testReportNumber">Test Report Number *</Label>
                                    <Input
                                        id="testReportNumber"
                                        value={testForm.testReportNumber}
                                        onChange={(e) => setTestForm({ ...testForm, testReportNumber: e.target.value })}
                                        placeholder="e.g., MRL-2024-00123"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="labCertificationNumber">Lab Certification Number</Label>
                                    <Input
                                        id="labCertificationNumber"
                                        value={testForm.labCertificationNumber}
                                        onChange={(e) => setTestForm({ ...testForm, labCertificationNumber: e.target.value })}
                                        placeholder="e.g., NABL-12345"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="testDate">Test Date *</Label>
                                    <Input
                                        id="testDate"
                                        type="date"
                                        value={testForm.testDate}
                                        onChange={(e) => setTestForm({ ...testForm, testDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="testedBy">Tested By</Label>
                                    <Input
                                        id="testedBy"
                                        value={testForm.testedBy}
                                        onChange={(e) => setTestForm({ ...testForm, testedBy: e.target.value })}
                                        placeholder="Lab Technician Name"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="certificateUrl">Certificate URL (optional)</Label>
                                <Input
                                    id="certificateUrl"
                                    value={testForm.certificateUrl}
                                    onChange={(e) => setTestForm({ ...testForm, certificateUrl: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">Additional Notes</Label>
                                <textarea
                                    id="notes"
                                    className="w-full border rounded-md p-2 min-h-[80px]"
                                    value={testForm.notes}
                                    onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                                    placeholder="Any additional information about this test..."
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                Submit Lab Test
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MRLCompliancePage;
