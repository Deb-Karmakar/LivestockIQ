import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ShieldCheck, ArrowLeft, Database, Calendar, Shield,
    RefreshCw, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { getFarmAuditTrail, getBlockchainSnapshots } from '../../services/auditService';
import { useToast } from '../../hooks/use-toast';
import AuditTrailTable from '../../components/AuditTrailTable';
import BlockchainVerificationDialog from '../../components/BlockchainVerificationDialog';

const FarmAuditTrailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [auditLogs, setAuditLogs] = useState([]);
    const [blockchainSnapshots, setBlockchainSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState('all');
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch audit logs
            const logs = await getFarmAuditTrail(id, { limit: 150 });
            setAuditLogs(logs);

            // Fetch blockchain snapshots
            try {
                const snapshots = await getBlockchainSnapshots(id);
                setBlockchainSnapshots(snapshots || []);
            } catch (err) {
                console.warn('Could not load blockchain snapshots:', err);
                setBlockchainSnapshots([]);
            }
        } catch (error) {
            console.error('Error fetching farm audit data:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load audit trail"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const handleVerify = (logId) => {
        setSelectedLogId(logId);
        setVerificationDialogOpen(true);
    };

    const filteredLogs = eventFilter === 'all'
        ? auditLogs
        : auditLogs.filter(log => log.eventType === eventFilter);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading audit trail...</p>
            </div>
        );
    }

    const firstLog = auditLogs[0];
    const lastLog = auditLogs[auditLogs.length - 1];

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative space-y-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-white hover:bg-white/10 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Blockchain Verification</span>
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-bold">
                        Farm Audit Trail
                    </h1>

                    <p className="text-slate-400 max-w-2xl">
                        Complete audit history for this farm with blockchain verification. All records are cryptographically secured and verifiable on the public Polygon Amoy blockchain.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                        <Database className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{auditLogs.length}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Audit logs tracked
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blockchain Snapshots</CardTitle>
                        <Shield className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {blockchainSnapshots.length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Verified on public blockchain
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Date Range</CardTitle>
                        <Calendar className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        {firstLog && lastLog ? (
                            <>
                                <div className="text-sm font-semibold">
                                    {format(new Date(lastLog.timestamp || lastLog.createdAt), 'MMM d, yyyy')}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Since {format(new Date(firstLog.timestamp || firstLog.createdAt), 'MMM d, yyyy')}
                                </p>
                            </>
                        ) : (
                            <div className="text-sm text-slate-500">No data</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Filter className="w-5 h-5 text-blue-600" />
                            </div>
                            <CardTitle>Filter Audit Logs</CardTitle>
                        </div>

                        <div className="flex gap-3">
                            <Select value={eventFilter} onValueChange={setEventFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Event Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    <SelectItem value="CREATE">Create</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="DELETE">Delete</SelectItem>
                                    <SelectItem value="APPROVE">Approve</SelectItem>
                                    <SelectItem value="BLOCKCHAIN_ANCHOR">Blockchain Anchor</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Audit Trail Table */}
            <AuditTrailTable
                logs={filteredLogs}
                onVerify={handleVerify}
            />

            {/* Blockchain Verification Dialog */}
            <BlockchainVerificationDialog
                logId={selectedLogId}
                isOpen={verificationDialogOpen}
                onClose={() => {
                    setVerificationDialogOpen(false);
                    setSelectedLogId(null);
                }}
            />
        </div>
    );
};

export default FarmAuditTrailPage;
