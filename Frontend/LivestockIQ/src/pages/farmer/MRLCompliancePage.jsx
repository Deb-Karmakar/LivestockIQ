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
    Download,
    Sparkles,
    Users
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
import { getWithdrawalStatus } from '@/services/feedAdministrationService';
import { format } from 'date-fns';

// Animated counter component (matching Dashboard and AnimalsPage)
const AnimatedCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{count}</span>;
};

// Stat Card Component (matching Dashboard and AnimalsPage)
const StatCard = ({ title, value, color, icon: Icon }) => {
    const colorClasses = {
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/25',
        yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/25',
        red: 'from-red-500 to-red-600 shadow-red-500/25',
    };

    return (
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-[0.03]`} />
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                <AnimatedCounter value={value} />
                            </span>
                        </div>
                    </div>
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 opacity-50" />
                </div>
            </CardContent>
        </Card>
    );
};

const MRLCompliancePage = () => {
    const [animals, setAnimals] = useState([]);
    const [mrlStatuses, setMRLStatuses] = useState({});
    const [pendingTests, setPendingTests] = useState([]);
    const [testHistory, setTestHistory] = useState([]);
    const [feedWithdrawals, setFeedWithdrawals] = useState([]);
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

            // Fetch feed withdrawals
            try {
                const feedWithdrawalData = await getWithdrawalStatus();
                setFeedWithdrawals(feedWithdrawalData || []);
            } catch (feedError) {
                console.error('Error fetching feed withdrawals:', feedError);
                setFeedWithdrawals([]);
            }

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
                return (
                    <div className="flex flex-col items-start gap-1">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Safe for Sale
                        </Badge>
                    </div>
                );
            case 'PENDING_VERIFICATION':
                return (
                    <div className="flex flex-col items-start gap-1">
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Verification
                        </Badge>
                        <span className="text-xs text-gray-500 italic">Passed system check</span>
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading MRL compliance data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Compliance Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            MRL Compliance Dashboard
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Monitor Maximum Residue Limits and ensure safe product sales. You have{' '}
                            <span className="text-emerald-400 font-semibold">{safeAnimals.length} animals</span> safe for sale.
                        </p>
                    </div>

                    <div className="w-full lg:w-auto">
                        <Button
                            size="lg"
                            onClick={() => handleOpenUploadDialog()}
                            className="w-full lg:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
                        >
                            <Upload className="mr-2 h-5 w-5" />
                            Upload Lab Test
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard
                    title="Safe for Sale"
                    value={safeAnimals.length}
                    color="green"
                    icon={CheckCircle2}
                />
                <StatCard
                    title="Tests Required"
                    value={testsRequired}
                    color="yellow"
                    icon={Clock}
                />
                <StatCard
                    title="MRL Violations"
                    value={violationCount}
                    color="red"
                    icon={AlertTriangle}
                />
                <StatCard
                    title="Pending Tests"
                    value={pendingTests.length}
                    color="blue"
                    icon={FileText}
                />
            </div>

            {/* Feed Withdrawals Alert */}
            {feedWithdrawals.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <CardTitle className="text-orange-900">Animals Under Feed-Based Withdrawal</CardTitle>
                        </div>
                        <CardDescription className="text-orange-700">
                            {feedWithdrawals.length} animal(s) currently in withdrawal period from medicated feed
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {feedWithdrawals.map((withdrawal) => (
                                <div key={withdrawal._id} className="bg-white border border-orange-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {withdrawal.groupName || `${withdrawal.numberOfAnimals} animal(s)`}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Feed: {withdrawal.feedId?.feedName} ({withdrawal.feedId?.antimicrobialName})
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="bg-orange-500 text-white">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {withdrawal.daysUntilWithdrawalEnd > 0
                                                ? `${withdrawal.daysUntilWithdrawalEnd} days left`
                                                : 'Ending today'}
                                        </Badge>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Until: {format(new Date(withdrawal.withdrawalEndDate), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                    <TabsTrigger value="overview">Animal Status</TabsTrigger>
                    <TabsTrigger value="pending">
                        Pending Tests
                        {pendingTests.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                                {pendingTests.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history">Test History</TabsTrigger>
                </TabsList>

                {/* Animal Status Tab */}
                <TabsContent value="overview">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <CardTitle>Animal MRL Compliance Status</CardTitle>
                            <CardDescription>
                                View MRL compliance status for all animals on your farm
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left p-3 text-sm font-semibold text-gray-600">Animal ID</th>
                                            <th className="text-left p-3 text-sm font-semibold text-gray-600 hidden sm:table-cell">Name</th>
                                            <th className="text-left p-3 text-sm font-semibold text-gray-600 hidden md:table-cell">Species</th>
                                            <th className="text-left p-3 text-sm font-semibold text-gray-600">MRL Status</th>
                                            <th className="text-left p-3 text-sm font-semibold text-gray-600 hidden lg:table-cell">Can Sell?</th>
                                            <th className="text-right p-3 text-sm font-semibold text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {animals.map((animal) => {
                                            const status = mrlStatuses[animal.tagId];
                                            return (
                                                <tr key={animal.tagId} className="border-b hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <div className="font-mono text-sm font-medium">{animal.tagId}</div>
                                                        <div className="text-xs text-gray-500 sm:hidden">{animal.name}</div>
                                                    </td>
                                                    <td className="p-3 font-medium hidden sm:table-cell">{animal.name}</td>
                                                    <td className="p-3 hidden md:table-cell">{animal.species}</td>
                                                    <td className="p-3">{getMRLStatusBadge(status)}</td>
                                                    <td className="p-3 hidden lg:table-cell">
                                                        {status?.canSellProducts ? (
                                                            <span className="text-green-600 font-medium flex items-center gap-1">
                                                                <CheckCircle2 className="w-4 h-4" /> Yes
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600 font-medium flex items-center gap-1">
                                                                <XCircle className="w-4 h-4" /> No
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenUploadDialog(animal)}
                                                                disabled={
                                                                    status?.mrlStatus === 'WITHDRAWAL_ACTIVE' ||
                                                                    status?.mrlStatus === 'SAFE' ||
                                                                    (status?.details?.labTests?.[0]?.status === 'Pending Verification' && !status?.details?.labTests?.[0]?.violationResolved)
                                                                }
                                                                className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-50"
                                                                title={
                                                                    status?.mrlStatus === 'WITHDRAWAL_ACTIVE'
                                                                        ? "Cannot upload test during active withdrawal period"
                                                                        : status?.mrlStatus === 'SAFE'
                                                                            ? "Animal is already safe for sale. No further testing needed."
                                                                            : (status?.details?.labTests?.[0]?.status === 'Pending Verification' && !status?.details?.labTests?.[0]?.violationResolved)
                                                                                ? "Cannot upload new test while previous test is pending verification"
                                                                                : "Upload new lab test result"
                                                                }
                                                            >
                                                                <Upload className="w-4 h-4 sm:mr-2" />
                                                                <span className="hidden sm:inline">Upload Test</span>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {animals.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No animals found</p>
                                    <p className="text-sm text-gray-400 mt-1">Add animals to start tracking MRL compliance</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pending Tests Tab */}
                <TabsContent value="pending">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <CardTitle>Animals Needing MRL Testing</CardTitle>
                            <CardDescription>
                                These animals have completed withdrawal periods but lack MRL test results
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {pendingTests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <p className="text-lg font-medium text-gray-900">All Caught Up!</p>
                                    <p className="text-gray-600">No animals are pending MRL testing</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingTests.map((item) => (
                                        <div key={item.animalId} className="border rounded-xl p-4 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{item.animalName}</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        ID: <span className="font-mono">{item.animalId}</span> • {item.species}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {item.treatmentsCount} treatment(s) • Last treated: {format(new Date(item.lastTreatmentDate), 'MMM dd, yyyy')}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => handleOpenUploadDialog(animals.find(a => a.tagId === item.animalId))}
                                                    size="sm"
                                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-md"
                                                >
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Upload Test
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Test History Tab */}
                <TabsContent value="history">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                            <CardTitle>Lab Test History</CardTitle>
                            <CardDescription>
                                Complete history of all MRL tests submitted
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {testHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium text-gray-900">No Test History</p>
                                    <p className="text-gray-600">Upload your first lab test to see results here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {testHistory.map((test) => (
                                        <div key={test._id} className="border rounded-xl p-4 sm:p-5 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900 font-mono">{test.animalId}</p>
                                                    {test.isPassed ? (
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Passed
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-500 hover:bg-red-600 text-white">
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Failed
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="border-gray-300">
                                                        {test.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(new Date(test.testDate), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-gray-600 text-xs mb-1">Drug</p>
                                                    <p className="font-semibold text-gray-900 truncate">{test.drugName}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-gray-600 text-xs mb-1">Sample Type</p>
                                                    <p className="font-semibold text-gray-900 truncate">{test.sampleType}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-gray-600 text-xs mb-1">Residue Level</p>
                                                    <p className={`font-semibold truncate ${test.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {test.residueLevelDetected} {test.unit}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-gray-600 text-xs mb-1">MRL Threshold</p>
                                                    <p className="font-semibold text-gray-900 truncate">{test.mrlThreshold} {test.unit}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-3 flex items-center gap-2 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    Lab: {test.labName}
                                                </span>
                                                <span className="text-gray-400">•</span>
                                                <span>Report: {test.testReportNumber}</span>
                                            </p>
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
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <Upload className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <DialogTitle>Upload MRL Lab Test Result</DialogTitle>
                                <DialogDescription>
                                    Submit laboratory test results for MRL compliance verification
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={handleSubmitLabTest}>
                        <div className="grid gap-4 py-4">
                            {/* Animal Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <Label htmlFor="certificateUrl">Certificate URL *</Label>
                                <Input
                                    id="certificateUrl"
                                    value={testForm.certificateUrl}
                                    onChange={(e) => setTestForm({ ...testForm, certificateUrl: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    required
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

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button type="submit" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                                <Upload className="w-4 h-4 mr-2" />
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
