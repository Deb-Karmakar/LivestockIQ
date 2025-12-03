import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { verifyLogOnBlockchain } from '../services/auditService';

const BlockchainVerificationDialog = ({ logId, isOpen, onClose }) => {
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && logId) {
            const fetchVerification = async () => {
                setLoading(true);
                setVerification(null);
                try {
                    const data = await verifyLogOnBlockchain(logId);
                    setVerification(data);
                } catch (error) {
                    console.error('Verification error:', error);
                    setVerification({
                        isValid: false,
                        message: 'Failed to verify: ' + error.message
                    });
                } finally {
                    setLoading(false);
                }
            };
            fetchVerification();
        }
    }, [isOpen, logId]);

    const openBlockchainExplorer = () => {
        if (verification?.blockchainProof?.explorerUrl) {
            window.open(verification.blockchainProof.explorerUrl, '_blank');
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <span className="ml-3 text-lg">Verifying on blockchain...</span>
                </div>
            );
        }

        if (!verification) {
            return <p className="text-slate-600 p-8">No verification data available.</p>;
        }

        if (!verification.isValid) {
            return (
                <div className="space-y-6 p-6">
                    <div className="flex items-center justify-center p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
                        <AlertCircle className="h-16 w-16 text-amber-500 mr-4" />
                        <div>
                            <h3 className="font-semibold text-lg text-amber-900">Not Yet Anchored</h3>
                            <p className="text-amber-700">{verification.message}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <h4 className="font-semibold text-sm text-slate-700">Audit Log Details:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-slate-600">Event:</span> <span className="font-medium">{verification.logDetails?.eventType}</span></div>
                            <div><span className="text-slate-600">Entity:</span> <span className="font-medium">{verification.logDetails?.entityType}</span></div>
                            <div className="col-span-2"><span className="text-slate-600">Date:</span> <span className="font-medium">{verification.logDetails?.timestamp && format(new Date(verification.logDetails.timestamp), 'PPP p')}</span></div>
                        </div>
                    </div>
                </div>
            );
        }

        // Verified on blockchain!
        return (
            <div className="space-y-6 p-6">
                {/* Success Banner */}
                <div className="flex items-center justify-center p-6 bg-green-50 border-2 border-green-200 rounded-lg animate-in fade-in duration-500">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mr-4" />
                    <div>
                        <h3 className="font-semibold text-2xl text-green-900">✓ Blockchain Verified</h3>
                        <p className="text-green-700">This record is cryptographically proven on public blockchain</p>
                    </div>
                </div>

                {/* Log Details */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold text-slate-900 border-b pb-2">Audit Log Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-slate-600">Event Type:</span>
                            <div className="font-medium text-slate-900">{verification.logDetails?.eventType}</div>
                        </div>
                        <div>
                            <span className="text-slate-600">Entity Type:</span>
                            <div className="font-medium text-slate-900">{verification.logDetails?.entityType}</div>
                        </div>
                        <div className="col-span-2">
                            <span className="text-slate-600">Timestamp:</span>
                            <div className="font-medium text-slate-900">
                                {verification.logDetails?.timestamp && format(new Date(verification.logDetails.timestamp), 'PPP p')}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <span className="text-slate-600">Performed By:</span>
                            <div className="font-medium text-slate-900">{verification.logDetails?.performedBy}</div>
                        </div>
                    </div>
                </div>

                {/* Blockchain Proof */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold text-blue-900 border-b border-blue-200 pb-2">Blockchain Proof</h4>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-blue-700">Network:</span>
                            <div className="font-medium text-blue-900">Polygon Amoy (Public Testnet)</div>
                        </div>
                        <div>
                            <span className="text-blue-700">Transaction Hash:</span>
                            <div className="font-mono text-xs bg-white p-2 rounded border border-blue-200 break-all">
                                {verification.blockchainProof?.transactionHash}
                            </div>
                        </div>
                        <div>
                            <span className="text-blue-700">Block Number:</span>
                            <div className="font-medium text-blue-900">{verification.blockchainProof?.blockNumber?.toLocaleString()}</div>
                        </div>
                        <div>
                            <span className="text-blue-700">Merkle Root:</span>
                            <div className="font-mono text-xs bg-white p-2 rounded border border-blue-200 break-all">
                                {verification.blockchainProof?.merkleRoot}
                            </div>
                        </div>
                        <div>
                            <span className="text-blue-700">Anchored At:</span>
                            <div className="font-medium text-blue-900">
                                {verification.blockchainProof?.anchorTimestamp && format(new Date(verification.blockchainProof.anchorTimestamp), 'PPP p')}
                            </div>
                        </div>
                        <div>
                            <span className="text-blue-700">Logs in Snapshot:</span>
                            <div className="font-medium text-blue-900">{verification.blockchainProof?.totalLogsInSnapshot}</div>
                        </div>
                    </div>

                    <Button
                        onClick={openBlockchainExplorer}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Polygon Blockchain Explorer
                    </Button>
                </div>

                {/* Info Box */}
                <div className="bg-slate-100 border-l-4 border-slate-500 p-4 text-sm text-slate-700">
                    <p className="font-semibold mb-1">🔐 What does this mean?</p>
                    <p>This audit log is permanently recorded on the <strong>public Polygon Amoy blockchain</strong>. It cannot be modified, deleted, or backdated by anyone. This proof is valid for legal proceedings and regulatory compliance.</p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {loading ? 'Verifying...' : verification?.isValid ? 'Blockchain Verification' : 'Verification Status'}
                    </DialogTitle>
                    <DialogDescription>
                        {verification?.isValid
                            ? 'Cryptographic proof from public blockchain'
                            : 'Checking blockchain anchoring status'
                        }
                    </DialogDescription>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
};

export default BlockchainVerificationDialog;
