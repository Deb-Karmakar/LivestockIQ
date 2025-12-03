import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Trash2, Edit, Plus, FileCheck } from 'lucide-react';
import { format } from 'date-fns';

const AuditTrailTable = ({ logs, onVerify }) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="text-center p-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <p className="text-slate-600 text-lg">No audit logs found</p>
                <p className="text-slate-500 text-sm mt-2">Audit logs will appear here when farm activities are recorded</p>
            </div>
        );
    }

    const getEventIcon = (eventType) => {
        switch (eventType) {
            case 'DELETE': return <Trash2 className="h-4 w-4" />;
            case 'UPDATE': return <Edit className="h-4 w-4" />;
            case 'CREATE': return <Plus className="h-4 w-4" />;
            case 'APPROVE': return <FileCheck className="h-4 w-4" />;
            default: return null;
        }
    };

    const getEventColor = (eventType) => {
        switch (eventType) {
            case 'DELETE': return 'destructive';
            case 'UPDATE': return 'default';
            case 'CREATE': return 'default';
            case 'APPROVE': return 'default';
            case 'BLOCKCHAIN_ANCHOR': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <div className="rounded-lg border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Date & Time</TableHead>
                        <TableHead className="font-semibold">Event Type</TableHead>
                        <TableHead className="font-semibold">Entity Type</TableHead>
                        <TableHead className="font-semibold">Performed By</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log._id} className="hover:bg-slate-50">
                            <TableCell className="font-medium text-slate-900">
                                {format(new Date(log.timestamp || log.createdAt), 'PPP')}
                                <div className="text-xs text-slate-500">
                                    {format(new Date(log.timestamp || log.createdAt), 'p')}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={getEventColor(log.eventType)}
                                    className="flex items-center gap-1 w-fit"
                                >
                                    {getEventIcon(log.eventType)}
                                    {log.eventType}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-slate-700">{log.entityType}</span>
                                {log.entityId && (
                                    <div className="text-xs text-slate-500 font-mono mt-1">
                                        {log.entityId.toString().substring(0, 12)}...
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="text-slate-700">{log.performedByRole || 'System'}</div>
                                {log.performedBy?.farmOwner && (
                                    <div className="text-xs text-slate-500">{log.performedBy.farmOwner}</div>
                                )}
                                {log.performedBy?.fullName && (
                                    <div className="text-xs text-slate-500">{log.performedBy.fullName}</div>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {log.eventType !== 'BLOCKCHAIN_ANCHOR' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onVerify(log._id)}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                    >
                                        <ShieldCheck className="h-4 w-4 mr-1" />
                                        Verify on Blockchain
                                    </Button>
                                )}
                                {log.eventType === 'BLOCKCHAIN_ANCHOR' && (
                                    <Badge variant="secondary" className="text-xs">
                                        Blockchain Snapshot
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default AuditTrailTable;
