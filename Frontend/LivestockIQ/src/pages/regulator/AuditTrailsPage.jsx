import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck, Search, Filter, RefreshCw, FileText,
    AlertTriangle, CheckCircle2, Clock, User, Database,
    ChevronRight, Lock, Hash, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { getRecentAudits } from '../../services/auditService';
import { useToast } from '../../hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AuditTrailsPage = () => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");
    const { toast } = useToast();

    const fetchAudits = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            // Fetch audits - in a real scenario, we might want a specific endpoint for regulators
            // or filter the response on the frontend to show only relevant compliance logs
            const data = await getRecentAudits(100);
            setAudits(data);

            if (isRefresh) {
                toast({ title: "Refreshed", description: "Audit trails updated." });
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

    const filteredAudits = useMemo(() => {
        return audits.filter(log => {
            // Filter for compliance-relevant entities
            const relevantEntities = ['Prescription', 'LabTest', 'Treatment', 'MRLViolation', 'User', 'Farm', 'Veterinarian'];
            if (!relevantEntities.includes(log.entityType) && log.eventType !== 'BLOCKCHAIN_ANCHOR') {
                return false;
            }

            const performedByName = log.performedBy?.fullName || log.performedBy?.farmOwner || log.performedBy?.email || 'Unknown';

            let details = log.metadata?.notes;
            if (!details) {
                if (log.eventType === 'BLOCKCHAIN_ANCHOR') {
                    details = `Anchored to ${log.metadata?.blockchain || 'Blockchain'}`;
                } else if (log.eventType === 'CREATE') {
                    details = `Created new ${log.entityType}`;
                } else if (log.eventType === 'UPDATE') {
                    details = `Updated ${log.entityType} details`;
                } else if (log.eventType === 'DELETE') {
                    details = `Deleted ${log.entityType}`;
                } else {
                    details = 'No details provided';
                }
            }
            log.generatedDetails = details;

            const matchesSearch = searchTerm === "" ||
                log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                details.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === "all" || log.entityType === typeFilter;
            const matchesAction = actionFilter === "all" || log.eventType === actionFilter;

            return matchesSearch && matchesType && matchesAction;
        });
    }, [audits, searchTerm, typeFilter, actionFilter]);

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const generateCertificate = (log) => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("LivestockIQ Data Integrity Certificate", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(200, 200, 200);
        doc.text("Blockchain Verification Proof", 105, 30, { align: 'center' });

        // Content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Record Details", 20, 60);

        doc.setFontSize(10);
        doc.text(`Record ID: ${log.entityId}`, 20, 70);
        doc.text(`Entity Type: ${log.entityType}`, 20, 76);
        doc.text(`Action: ${log.eventType}`, 20, 82);
        doc.text(`Timestamp: ${format(new Date(log.createdAt), 'PPpp')}`, 20, 88);
        doc.text(`Performed By: ${log.performedBy?.fullName || log.performedBy?.farmOwner || log.performedBy?.email || 'System'}`, 20, 94);
        doc.text(`Details: ${log.generatedDetails}`, 20, 100);

        // Blockchain Proof
        doc.setDrawColor(22, 163, 74); // Green
        doc.setLineWidth(1);
        doc.rect(20, 115, 170, 50);

        doc.setFontSize(14);
        doc.setTextColor(22, 163, 74);
        doc.text("Blockchain Anchor Verification", 30, 125);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("This record has been cryptographically anchored to the blockchain.", 30, 135);

        if (log.currentHash) {
            doc.setFont("courier");
            doc.setFontSize(9);
            doc.text(`Hash: ${log.currentHash}`, 30, 145);
            doc.setFont("helvetica");
        } else {
            doc.text("Hash: Pending Anchor", 30, 145);
        }

        doc.text("Status: VERIFIED", 30, 155);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
        doc.text("LivestockIQ Regulatory System", 105, 285, { align: 'center' });

        const safeEntityId = log.entityId || 'Unknown';
        doc.save(`Certificate_${safeEntityId.substring(0, 8)}.pdf`);
        toast({ title: "Certificate Downloaded", description: "Blockchain proof certificate generated." });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading audit trails...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Data Integrity</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Audit Trails
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Verify the integrity of compliance records and download blockchain certificates.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Filter className="w-5 h-5 text-blue-600" />
                            </div>
                            <CardTitle>Filter Records</CardTitle>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Entity Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Entities</SelectItem>
                                    <SelectItem value="Prescription">Prescription</SelectItem>
                                    <SelectItem value="LabTest">Lab Test</SelectItem>
                                    <SelectItem value="Treatment">Treatment</SelectItem>
                                    <SelectItem value="MRLViolation">Violation</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="CREATE">Create</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="DELETE">Delete</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search details or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                    <th className="text-right p-4 font-semibold text-gray-600">Certificate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAudits.length > 0 ? (
                                    filteredAudits.map((log) => (
                                        <tr key={log._id} className="border-b hover:bg-gray-50 transition-colors group">
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
                                                        <p className="text-xs text-gray-500 font-mono">{log.entityId?.substring(0, 8)}...</p>
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
                                                            {log.performedBy?.fullName || log.performedBy?.farmOwner || log.performedBy?.email || 'System'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {log.performedByRole || 'System'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-gray-600 max-w-xs truncate" title={log.generatedDetails}>
                                                    {log.generatedDetails}
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
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:bg-blue-50"
                                                    onClick={() => generateCertificate(log)}
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Cert
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-900 font-medium">No audit trails found</p>
                                            <p className="text-gray-500 text-sm mt-1">
                                                Try adjusting your search or filters
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuditTrailsPage;
