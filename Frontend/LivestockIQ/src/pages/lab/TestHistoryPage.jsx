// frontend/src/pages/lab/TestHistoryPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';
import {
    FlaskConical,
    CheckCircle2,
    XCircle,
    Search,
    Sparkles,
    ExternalLink,
    Filter,
    RefreshCw
} from 'lucide-react';
import { getMyMRLTests } from '../../services/labService';
import { useToast } from '../../hooks/use-toast';

const TestHistoryPage = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ status: 'all', search: '' });
    const navigate = useNavigate();
    const { toast } = useToast();

    const fetchTests = async (page = 1) => {
        try {
            setLoading(true);
            const data = await getMyMRLTests({ page, status: filters.status });
            setTests(data.data || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1 });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load test history' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, [filters.status]);

    const filteredTests = tests.filter(test => {
        if (!filters.search) return true;
        return test.animalId.toLowerCase().includes(filters.search.toLowerCase()) ||
            test.drugName.toLowerCase().includes(filters.search.toLowerCase());
    });

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Test History</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">MRL Test History</h1>
                        <p className="text-emerald-200">View all tests you have uploaded</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by Animal ID or Drug..."
                                className="pl-10"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tests</SelectItem>
                                <SelectItem value="Pending Verification">Pending</SelectItem>
                                <SelectItem value="Verified">Verified</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Test Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-gray-400" />
                        Test Results
                    </CardTitle>
                    <CardDescription>
                        Showing {filteredTests.length} of {pagination.totalItems || tests.length} tests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-4 border-gray-200 rounded-full border-t-emerald-600 animate-spin" />
                        </div>
                    ) : filteredTests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Animal ID</TableHead>
                                        <TableHead>Drug</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Residue Level</TableHead>
                                        <TableHead>MRL Limit</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTests.map((test) => (
                                        <TableRow key={test._id}>
                                            <TableCell className="font-mono font-medium">{test.animalId}</TableCell>
                                            <TableCell>{test.drugName}</TableCell>
                                            <TableCell>{test.productType}</TableCell>
                                            <TableCell>
                                                {test.residueLevelDetected} {test.unit}
                                            </TableCell>
                                            <TableCell>
                                                {test.mrlThreshold} {test.unit}
                                            </TableCell>
                                            <TableCell>
                                                {test.isPassed ? (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        PASSED
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-800">
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        FAILED
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(test.testDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{test.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {test.certificateUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => window.open(test.certificateUrl, '_blank')}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <FlaskConical className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No tests found</p>
                            <Button
                                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => navigate('/lab/upload-test')}
                            >
                                Upload a Test
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                disabled={pagination.currentPage <= 1}
                                onClick={() => fetchTests(pagination.currentPage - 1)}
                            >
                                Previous
                            </Button>
                            <span className="flex items-center px-4 text-sm text-gray-500">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                disabled={pagination.currentPage >= pagination.totalPages}
                                onClick={() => fetchTests(pagination.currentPage + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TestHistoryPage;
