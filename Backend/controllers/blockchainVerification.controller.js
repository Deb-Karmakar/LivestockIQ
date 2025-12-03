import {
    findBlockchainSnapshotForLog,
    getBlockchainSnapshots as getBlockchainSnapshotsService,
} from '../services/auditLog.service.js';
import AuditLog from '../models/auditLog.model.js';

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
            message: 'Audit log verified on blockchain',
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
