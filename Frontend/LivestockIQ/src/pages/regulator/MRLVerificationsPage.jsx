// Frontend/LivestockIQ/src/pages/regulator/MRLVerificationsPage.jsx

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { getPendingVerifications, getVerificationStats, getLabTestDetails, verifyLabTest } from '@/services/mrlService';
import { format } from 'date-fns';

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
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading verifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8" />
                    <h1 className="text-3xl font-bold">MRL Test Verifications</h1>
                </div>
                <p className="text-blue-50">Review and approve pending lab test results</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Tests</p>
                                <p className="text-2xl font-bold text-blue-600">{stats?.pending?.total || 0}</p>
                            </div>
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Passed Tests</p>
                                <p className="text-2xl font-bold text-green-600">{stats?.pending?.passed || 0}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Failed Tests</p>
                                <p className="text-2xl font-bold text-red-600">{stats?.pending?.failed || 0}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Test List */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Verifications ({tests.length})</CardTitle>
                    <CardDescription>Lab tests awaiting regulator approval</CardDescription>
                </CardHeader>
                <CardContent>
                    {tests.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-medium">All Caught Up!</p>
                            <p className="text-gray-600">No pending verifications</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tests.map((test) => (
                                <div key={test._id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {test.isPassed ? (
                                                    <Badge className="bg-green-500">PASSED</Badge>
                                                ) : (
                                                    <Badge className="bg-red-500">FAILED</Badge>
                                                )}
                                                <Badge variant="outline">{test.status}</Badge>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {test.drugName} - {test.productType}
                                            </h3>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>
                                                    <span className="font-medium">Farm:</span> {test.farmerId?.farmName || 'Unknown'}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Animal:</span> {test.animalId?.name || test.animalId} ({test.animalId?.tagId || ''})
                                                </p>
                                                <p>
                                                    <span className="font-medium">Residue:</span> {test.residueLevelDetected} {test.unit} / MRL: {test.mrlThreshold} {test.unit}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Test Date: {format(new Date(test.testDate), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewDetails(test)}
                                            >
                                                Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleOpenVerifyModal(test, true)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleOpenVerifyModal(test, false)}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Lab Test Details</DialogTitle>
                    </DialogHeader>
                    {selectedTest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h4 className="font-semibold text-gray-600">Drug Name</h4>
                                    <p>{selectedTest.drugName}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-600">Product Type</h4>
                                    <p>{selectedTest.productType}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-600">Residue Detected</h4>
                                    <p className={selectedTest.isPassed ? 'text-green-600' : 'text-red-600'}>
                                        {selectedTest.residueLevelDetected} {selectedTest.unit}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-600">MRL Threshold</h4>
                                    <p>{selectedTest.mrlThreshold} {selectedTest.unit}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-600">Lab Name</h4>
                                    <p>{selectedTest.labName}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-600">Test Report #</h4>
                                    <p>{selectedTest.testReportNumber}</p>
                                </div>
                                {selectedTest.certificateUrl && (
                                    <div className="col-span-2">
                                        <h4 className="font-semibold text-gray-600">Lab Certificate</h4>
                                        <a
                                            href={selectedTest.certificateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline break-all"
                                        >
                                            View Report
                                        </a>
                                    </div>
                                )}
                            </div>
                            {selectedTest.notes && (
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-600">Notes</h4>
                                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedTest.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setDetailModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Verify Modal */}
            <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedTest?.approved ? 'Approve' : 'Reject'} Lab Test
                        </DialogTitle>
                        <DialogDescription>
                            Add verification notes (optional)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Verification Notes</Label>
                            <textarea
                                className="w-full border rounded-md p-2 min-h-[100px]"
                                placeholder="Add notes about your decision..."
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerifyModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleVerify}
                            disabled={verifying}
                            className={selectedTest?.approved ? 'bg-green-600 hover:bg-green-700' : ''}
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
