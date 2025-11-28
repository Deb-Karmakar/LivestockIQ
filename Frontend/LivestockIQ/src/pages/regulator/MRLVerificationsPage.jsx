// Frontend/LivestockIQ/src/pages/regulator/MRLVerificationsPage.jsx

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { getPendingVerifications, getVerificationStats, getLabTestDetails, verifyLabTest } from '@/services/mrlService';
import { format } from 'date-fns';

// Animated counter component
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

// Stat Card Component
const StatCard = ({ title, value, color, icon: Icon }) => {
    const colorClasses = {
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
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

const MRLVerificationsPage = () => {
    const [tests, setTests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [testsData, statsData] = await Promise.all([
                getPendingVerifications({ limit: 50 }),
                getVerificationStats()
            ]);
            setTests(testsData.tests || []);
            setStats(statsData);
        } catch (error) {
            toast.error('Failed to load pending verifications');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (test) => {
        try {
            const data = await getLabTestDetails(test._id);
            setSelectedTest(data.test);
            setDetailModalOpen(true);
        } catch (error) {
            toast.error('Failed to load test details');
        }
    };

    const handleOpenVerifyModal = (test, approved) => {
        setSelectedTest({ ...test, approved });
        setVerificationNotes('');
        setVerifyModalOpen(true);
    };

    const handleVerify = async () => {
        try {
            setVerifying(true);
            await verifyLabTest(selectedTest._id, selectedTest.approved, verificationNotes);
            toast.success(selectedTest.approved ? 'Test approved successfully' : 'Test rejected');
            setVerifyModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to verify test');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading verifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

                <div className="relative space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        <span>Verification Management</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold">
                        MRL Test Verifications
                    </h1>
                    <p className="text-slate-400 max-w-md">
                        Review and approve pending lab test results. You have{' '}
                        <span className="text-blue-400 font-semibold">{stats?.pending?.total || 0} tests</span> awaiting verification.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                <StatCard
                    title="Pending Tests"
                    value={stats?.pending?.total || 0}
                    color="blue"
                    icon={Clock}
                />
                <StatCard
                    title="Passed Tests"
                    value={stats?.pending?.passed || 0}
                    color="green"
                    icon={CheckCircle}
                />
                <StatCard
                    title="Failed Tests"
                    value={stats?.pending?.failed || 0}
                    color="red"
                    icon={AlertTriangle}
                />
            </div>

            {/* Test List */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle>Pending Verifications ({tests.length})</CardTitle>
                    <CardDescription>Lab tests awaiting regulator approval</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    {tests.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <p className="text-lg font-medium">All Caught Up!</p>
                            <p className="text-gray-600">No pending verifications</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tests.map((test) => (
                                <div key={test._id} className="border rounded-xl p-4 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {test.isPassed ? (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        PASSED
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-500 hover:bg-red-600 text-white">
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        FAILED
                                                    </Badge>
                                                )}
                                                <Badge variant="outline">{test.status}</Badge>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                                                {test.drugName} - {test.productType}
                                            </h3>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p className="truncate">
                                                    <span className="font-medium">Farm:</span> {test.farmerId?.farmName || 'Unknown'}
                                                </p>
                                                <p className="truncate">
                                                    <span className="font-medium">Animal:</span> {test.animalId?.name || test.animalId} ({test.animalId?.tagId || ''})
                                                </p>
                                                <p className="truncate">
                                                    <span className="font-medium">Residue:</span> {test.residueLevelDetected} {test.unit} / MRL: {test.mrlThreshold} {test.unit}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Test Date: {format(new Date(test.testDate), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-row lg:flex-col items-center gap-2 w-full lg:w-auto">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewDetails(test)}
                                                className="flex-1 lg:flex-none lg:w-full"
                                            >
                                                <FileText className="w-4 h-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Details</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 lg:flex-none lg:w-full bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => handleOpenVerifyModal(test, true)}
                                            >
                                                <CheckCircle className="w-4 h-4 sm:mr-1" />
                                                <span className="hidden sm:inline">Approve</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleOpenVerifyModal(test, false)}
                                                className="flex-1 lg:flex-none lg:w-full"
                                            >
                                                <XCircle className="w-4 h-4 sm:mr-1" />
                                                <span className="hidden sm:inline">Reject</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <DialogTitle>Lab Test Details</DialogTitle>
                                <DialogDescription>Complete test information</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    {selectedTest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-600 text-xs mb-1">Drug Name</h4>
                                    <p className="font-medium">{selectedTest.drugName}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-600 text-xs mb-1">Product Type</h4>
                                    <p className="font-medium">{selectedTest.productType}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-600 text-xs mb-1">Residue Detected</h4>
                                    <p className={`font-semibold ${selectedTest.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {selectedTest.residueLevelDetected} {selectedTest.unit}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-600 text-xs mb-1">MRL Threshold</h4>
                                    <p className="font-medium">{selectedTest.mrlThreshold} {selectedTest.unit}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-600 text-xs mb-1">Lab Name</h4>
                                    <p className="font-medium">{selectedTest.labName}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-600 text-xs mb-1">Test Report #</h4>
                                    <p className="font-medium">{selectedTest.testReportNumber}</p>
                                </div>
                                {selectedTest.certificateUrl && (
                                    <div className="col-span-full bg-gray-50 rounded-lg p-3">
                                        <h4 className="font-semibold text-gray-600 text-xs mb-1">Lab Certificate</h4>
                                        <a
                                            href={selectedTest.certificateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline break-all text-sm"
                                        >
                                            View Report
                                        </a>
                                    </div>
                                )}
                            </div>
                            {selectedTest.notes && (
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Notes</h4>
                                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedTest.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button onClick={() => setDetailModalOpen(false)} className="w-full sm:w-auto">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Verify Modal */}
            <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${selectedTest?.approved ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {selectedTest?.approved ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                )}
                            </div>
                            <div>
                                <DialogTitle>
                                    {selectedTest?.approved ? 'Approve' : 'Reject'} Lab Test
                                </DialogTitle>
                                <DialogDescription>
                                    Add verification notes (optional)
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Verification Notes</Label>
                            <textarea
                                className="w-full border rounded-md p-2 min-h-[100px] mt-2"
                                placeholder="Add notes about your decision..."
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setVerifyModalOpen(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleVerify}
                            disabled={verifying}
                            className={`w-full sm:w-auto ${selectedTest?.approved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        >
                            {verifying ? 'Processing...' : selectedTest?.approved ? 'Approve Test' : 'Reject Test'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MRLVerificationsPage;
