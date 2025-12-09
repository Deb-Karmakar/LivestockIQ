import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck, Search, Filter, RefreshCw,
    User, Database, ChevronRight, Lock, Hash, ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { getRecentAudits } from '../../services/auditService';
import { useToast } from '../../hooks/use-toast';
import BlockchainVerificationDialog from '../../components/BlockchainVerificationDialog';

const AuditTrailsPage = () => {
    // State Management
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
    const { toast } = useToast();

    // Fetch Audit Logs
    const fetchAudits = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await getRecentAudits(pageSize * 2);
            setAudits(data);

            if (isRefresh) {
                toast({ title: "Refreshed", description: "Audit trails updated successfully." });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load audit trails."
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAudits();
    }, []);

    // Generate details text for display
    const generateDetails = (log) => {
        if (log.metadata?.notes) return log.metadata.notes;

        switch (log.eventType) {
            case 'BLOCKCHAIN_ANCHOR':
                return `Anchored to ${log.metadata?.blockchain || 'Blockchain'}`;
            case 'CREATE':
                return `Created new ${log.entityType}`;
            case 'UPDATE':
                return `Updated ${log.entityType} details`;
            case 'DELETE':
                return `Deleted ${log.entityType}`;
            case 'APPROVE':
                return `Approved ${log.entityType}`;
            case 'REJECT':
                return `Rejected ${log.entityType}`;
            default:
                return 'Record logged';
        }
    };

    // Filter Audits (NO restrictive entity filtering - show ALL)
    const filteredAudits = useMemo(() => {
        return audits.filter(log => {
            const performedByName = log.performedBy?.fullName || log.performedBy?.farmOwner || log.performedBy?.email || 'System';
            const details = generateDetails(log);

            const matchesSearch = searchTerm === "" ||
                log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.entityType?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === "all" || log.entityType === typeFilter;
            const matchesAction = actionFilter === "all" || log.eventType === actionFilter;

            return matchesSearch && matchesType && matchesAction;
        });
    }, [audits, searchTerm, typeFilter, actionFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredAudits.length / pageSize) || 1;
    const paginatedAudits = filteredAudits.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Blockchain Verification Handlers
    const handleVerifyLog = (logId) => {
        setSelectedLogId(logId);
        setIsVerificationDialogOpen(true);
    };

    const handleCloseVerificationDialog = () => {
        setIsVerificationDialogOpen(false);
        setSelectedLogId(null);
    };

    // Action Badge Colors
    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
            case 'APPROVE': return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECT': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'BLOCKCHAIN_ANCHOR': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Get unique entity types for filter dropdown
    const entityTypes = useMemo(() => {
        const types = new Set(audits.map(log => log.entityType));
        return Array.from(types).sort();
    }, [audits]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading global audit trails...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Global Monitoring</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            System Audit Trails
                        </h1>
                        <p className="text-slate-400 max-w-2xl">
                            Monitor all system activity across all farms with blockchain verification. {filteredAudits.length} records found.
                        </p>
                    </div>
                    <Button
                        onClick={() => fetchAudits(true)}
                        disabled={refreshing}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Filters & Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Filter className="w-5 h-5 text-blue-600" />
                            </div>
                            <CardTitle>Filter & Search</CardTitle>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="Entity Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Entities ({audits.length})</SelectItem>
                                    {entityTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="CREATE">Create</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="DELETE">Delete</SelectItem>
                                    <SelectItem value="APPROVE">Approve</SelectItem>
                                    <SelectItem value="REJECT">Reject</SelectItem>
                                    <SelectItem value="BLOCKCHAIN_ANCHOR">Blockchain Anchor</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50/50">
                                    <th className="text-left p-4 font-semibold text-gray-600">Timestamp</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Action</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Entity</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Performed By</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Details</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Integrity</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Blockchain</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAudits.length > 0 ? (
                                    paginatedAudits.map((log) => {
                                        const performedByIdentity = log.performedBy?.fullName || log.performedBy?.farmOwner || log.performedBy?.email;
                                        const isSystemAnchor = log.eventType === 'BLOCKCHAIN_ANCHOR' && !performedByIdentity;

                                        // Check if this log has blockchain verification data in metadata
                                        const hasBlockchainData = log.metadata?.blockchain?.verified === true;
                                        const blockchainTxHash = log.metadata?.blockchain?.transactionHash;
                                        const blockchainExplorerUrl = log.metadata?.blockchain?.explorerUrl;

                                        return (
                                            <tr key={log._id} className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">
                                                            {format(new Date(log.createdAt), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {format(new Date(log.createdAt), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className={getActionColor(log.eventType)}>
                                                        {log.eventType}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Database className="w-4 h-4 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{log.entityType}</p>
                                                            {log.entityId && (
                                                                <p className="text-xs text-gray-500 font-mono">{log.entityId.substring(0, 8)}...</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gray-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {performedByIdentity || 'System'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {log.performedByRole || 'System'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-sm text-gray-600 max-w-xs truncate" title={generateDetails(log)}>
                                                        {generateDetails(log)}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit border border-emerald-100">
                                                            <Lock className="w-3 h-3" />
                                                            <span className="text-xs font-medium">Verified</span>
                                                        </div>
                                                        {log.currentHash && (
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(log.currentHash);
                                                                    toast({ title: "Copied", description: "Hash copied to clipboard" });
                                                                }}
                                                                className="flex items-center gap-1 text-xs text-gray-400 font-mono hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors text-left"
                                                                title="Click to copy full hash"
                                                            >
                                                                <Hash className="w-3 h-3" />
                                                                {log.currentHash.substring(0, 12)}...
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {isSystemAnchor ? (
                                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                                            Anchor Record
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleVerifyLog(log._id)}
                                                            className="text-blue-600 hover:text-blue-700"
                                                        >
                                                            <ShieldCheck className="h-4 w-4 mr-1" />
                                                            Verify
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-900 font-medium">No audit trails found</p>
                                            <p className="text-gray-500 text-sm mt-1">
                                                Try adjusting your filters or search terms
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * pageSize, filteredAudits.length)}</span> of{' '}
                            <span className="font-medium">{filteredAudits.length}</span> records
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}
                                {totalPages > 5 && <span className="px-2 text-gray-400">...</span>}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Blockchain Verification Dialog */}
            <BlockchainVerificationDialog
                logId={selectedLogId}
                isOpen={isVerificationDialogOpen}
                onClose={handleCloseVerificationDialog}
            />
        </div>
    );
};

export default AuditTrailsPage;
