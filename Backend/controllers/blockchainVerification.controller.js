import {
    findBlockchainSnapshotForLog,
    getBlockchainSnapshots as getBlockchainSnapshotsService,
} from '../services/auditLog.service.js';
import AuditLog from '../models/auditLog.model.js';
import { generateBlockchainCertificate } from '../utils/pdfGenerator.js';

/**
 * Verify a specific audit log on blockchain
 * @route   GET /api/audit/verify-blockchain/:logId
 * @access  Private (Regulator, Admin, or own farm)
 */
export const verifyLogOnBlockchain = async (req, res) => {
    try {
        const { logId } = req.params;

        // Get the audit log
        const log = await AuditLog.findById(logId).lean();
        if (!log) {
            return res.status(404).json({ message: 'Audit log not found' });
        }

        // Authorization check
        const userRole = req.user.role?.toLowerCase();
        const isAuthorized =
            userRole === 'regulator' ||
            userRole === 'admin' ||
            req.user._id.toString() === log.farmerId.toString();

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to verify this audit log' });
        }

        // Check if this audit log has immediate blockchain verification in its metadata
        // (for entities like lab tests that are anchored during creation)
        console.log(`[DEBUG] Checking blockchain verification for log ${logId}`);
        console.log(`[DEBUG] Log metadata:`, JSON.stringify(log.metadata, null, 2));
        console.log(`[DEBUG] Has blockchain metadata?`, log.metadata?.blockchain?.verified);

        if (log.metadata?.blockchain?.verified === true) {
            const blockchainProof = {
                transactionHash: log.metadata.blockchain.transactionHash,
                blockNumber: log.metadata.blockchain.blockNumber,
                merkleRoot: log.currentHash, // The entity's hash was anchored
                explorerUrl: log.metadata.blockchain.explorerUrl ||
                    `https://amoy.polygonscan.com/tx/${log.metadata.blockchain.transactionHash}`,
                anchorTimestamp: log.createdAt,
                totalLogsInSnapshot: 1, // Individual entity anchoring
            };

            return res.json({
                isValid: true,
                message: 'Entity verified on blockchain (immediate anchoring)',
                logDetails: {
                    id: log._id,
                    eventType: log.eventType,
                    entityType: log.entityType,
                    timestamp: log.timestamp,
                    currentHash: log.currentHash,
                    performedBy: log.performedByRole,
                },
                blockchainProof,
            });
        }

        // If not immediately anchored, check for batch snapshot anchoring
        // Find blockchain snapshot containing this log
        const snapshot = await findBlockchainSnapshotForLog(logId);

        if (!snapshot) {
            return res.json({
                isValid: false,
                message: 'This audit log has not been anchored to blockchain yet',
                logDetails: {
                    id: log._id,
                    eventType: log.eventType,
                    entityType: log.entityType,
                    timestamp: log.timestamp,
                    currentHash: log.currentHash,
                },
            });
        }

        // Get blockchain data from snapshot
        const blockchainProof = {
            transactionHash: snapshot.dataSnapshot.transactionHash,
            blockNumber: snapshot.dataSnapshot.blockNumber,
            merkleRoot: snapshot.dataSnapshot.merkleRoot,
            explorerUrl: snapshot.dataSnapshot.explorerUrl ||
                `https://amoy.polygonscan.com/tx/${snapshot.dataSnapshot.transactionHash}`,
            anchorTimestamp: snapshot.timestamp,
            totalLogsInSnapshot: snapshot.dataSnapshot.totalLogs,
        };

        res.json({
            isValid: true,
            message: 'Audit log verified on blockchain (batch snapshot)',
            logDetails: {
                id: log._id,
                eventType: log.eventType,
                entityType: log.entityType,
                timestamp: log.timestamp,
                currentHash: log.currentHash,
                performedBy: log.performedByRole,
            },
            blockchainProof,
        });
    } catch (error) {
        console.error('Error verifying log on blockchain:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * Get all blockchain snapshots for a farm
 * @route   GET /api/audit/blockchain-snapshots/:farmerId
 * @access  Private (Regulator, Admin, or own farm)
 */
export const getBlockchainSnapshotsController = async (req, res) => {
    try {
        const { farmerId } = req.params;

        // Authorization check
        const userRole = req.user.role?.toLowerCase();
        const isAuthorized =
            userRole === 'regulator' ||
            userRole === 'admin' ||
            req.user._id.toString() === farmerId;

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to access this farm\'s blockchain snapshots' });
        }

        const snapshots = await getBlockchainSnapshotsService(farmerId);

        // Format response
        const formattedSnapshots = snapshots.map(s => ({
            id: s._id,
            timestamp: s.timestamp,
            merkleRoot: s.dataSnapshot.merkleRoot,
            transactionHash: s.dataSnapshot.transactionHash,
            blockNumber: s.dataSnapshot.blockNumber,
            totalLogs: s.dataSnapshot.totalLogs,
            explorerUrl: s.dataSnapshot.explorerUrl ||
                `https://amoy.polygonscan.com/tx/${s.dataSnapshot.transactionHash}`,
            dateRange: {
                first: s.dataSnapshot.firstLogTimestamp,
                last: s.dataSnapshot.lastLogTimestamp,
            },
        }));

        res.json({
            success: true,
            count: formattedSnapshots.length,
            data: formattedSnapshots,
        });
    } catch (error) {
        console.error('Error getting blockchain snapshots:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * Get detailed blockchain proof for a log (including Merkle path)
 * @route   GET /api/audit/blockchain-proof/:logId
 * @access  Private (Regulator, Admin, or own farm)
 */
export const getBlockchainProofForLog = async (req, res) => {
    try {
        const { logId } = req.params;

        // Get the audit log
        const log = await AuditLog.findById(logId)
            .populate('performedBy', 'farmOwner fullName email vetId')
            .lean();

        if (!log) {
            return res.status(404).json({ message: 'Audit log not found' });
        }

        // Authorization check
        const userRole = req.user.role?.toLowerCase();
        const isAuthorized =
            userRole === 'regulator' ||
            userRole === 'admin' ||
            req.user._id.toString() === log.farmerId.toString();

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to access this audit log' });
        }

        // Find blockchain snapshot
        const snapshot = await findBlockchainSnapshotForLog(logId);

        if (!snapshot) {
            return res.json({
                success: false,
                message: 'Log not yet anchored to blockchain',
            });
        }

        // Complete blockchain proof
        const proof = {
            auditLog: {
                id: log._id,
                eventType: log.eventType,
                entityType: log.entityType,
                entityId: log.entityId,
                timestamp: log.timestamp,
                hash: log.currentHash,
                performedBy: log.performedBy,
                performedByRole: log.performedByRole,
                dataSnapshot: log.dataSnapshot,
            },
            blockchainAnchor: {
                id: snapshot._id,
                anchorTimestamp: snapshot.timestamp,
                merkleRoot: snapshot.dataSnapshot.merkleRoot,
                transactionHash: snapshot.dataSnapshot.transactionHash,
                blockNumber: snapshot.dataSnapshot.blockNumber,
                totalLogs: snapshot.dataSnapshot.totalLogs,
                explorerUrl: snapshot.dataSnapshot.explorerUrl ||
                    `https://amoy.polygonscan.com/tx/${snapshot.dataSnapshot.transactionHash}`,
            },
            verification: {
                isVerified: true,
                verificationMethod: snapshot.dataSnapshot.includedLogIds ? 'log_id_match' : 'timestamp_match',
                message: 'This audit log is cryptographically proven on Polygon Amoy blockchain',
            },
        };

        res.json({
            success: true,
            data: proof,
        });
    } catch (error) {
        console.error('Error getting blockchain proof:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * Download blockchain verification certificate as PDF
 * @route   GET /api/audit/blockchain-certificate/:logId
 * @access  Private (Regulator, Admin)
 */
export const downloadBlockchainCertificate = async (req, res) => {
    try {
        const { logId } = req.params;

        const log = await AuditLog.findById(logId).populate('performedBy', 'farmOwner fullName email').lean();
        if (!log) return res.status(404).json({ message: 'Audit log not found' });

        const userRole = req.user.role?.toLowerCase();
        if (userRole !== 'regulator' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Only regulators and admins can download certificates' });
        }

        const logDetails = {
            id: log._id.toString(),
            eventType: log.eventType,
            entityType: log.entityType,
            timestamp: log.timestamp || log.createdAt,
            performedBy: log.performedBy?.farmOwner || log.performedBy?.fullName || log.performedByRole || 'System',
        };

        let blockchainProof;

        // Check if this audit log has immediate blockchain verification in metadata
        if (log.metadata?.blockchain?.verified === true) {
            blockchainProof = {
                transactionHash: log.metadata.blockchain.transactionHash,
                blockNumber: log.metadata.blockchain.blockNumber,
                merkleRoot: log.currentHash,
                explorerUrl: log.metadata.blockchain.explorerUrl ||
                    `https://amoy.polygonscan.com/tx/${log.metadata.blockchain.transactionHash}`,
                anchorTimestamp: log.createdAt,
                totalLogsInSnapshot: 1,
            };
        } else {
            // Fall back to batch snapshot anchoring
            const snapshot = await findBlockchainSnapshotForLog(logId);
            if (!snapshot) {
                return res.status(400).json({ message: 'Cannot generate certificate - log not yet anchored to blockchain' });
            }

            blockchainProof = {
                transactionHash: snapshot.dataSnapshot.transactionHash,
                blockNumber: snapshot.dataSnapshot.blockNumber,
                merkleRoot: snapshot.dataSnapshot.merkleRoot,
                explorerUrl: snapshot.dataSnapshot.explorerUrl || `https://amoy.polygonscan.com/tx/${snapshot.dataSnapshot.transactionHash}`,
                anchorTimestamp: snapshot.timestamp,
                totalLogsInSnapshot: snapshot.dataSnapshot.totalLogs,
            };
        }

        const pdfBuffer = await generateBlockchainCertificate(logDetails, blockchainProof);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="blockchain-certificate-${logId.substring(0, 8)}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating blockchain certificate:', error);
        res.status(500).json({ message: 'Failed to generate certificate', error: error.message });
    }
};
