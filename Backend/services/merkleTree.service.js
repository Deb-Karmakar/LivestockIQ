import AuditLog from '../models/auditLog.model.js';
import { generateMerkleRoot } from '../utils/crypto.utils.js';

/**
 * Generate Merkle tree snapshot for a farm's audit logs
 * @param {ObjectId} farmerId - Farmer ID
 * @returns {Object} - Merkle root and snapshot info
 */
export const generateFarmMerkleSnapshot = async (farmerId) => {
    try {
        const auditLogs = await AuditLog.find({ farmerId })
            .sort({ timestamp: 1 })
            .select('_id currentHash timestamp')
            .lean();

        if (auditLogs.length === 0) {
            return {
                merkleRoot: null,
                totalLogs: 0,
                message: 'No audit logs found for this farm',
            };
        }

        // Extract all hashes
        const hashes = auditLogs.map(log => log.currentHash);

        // Extract log IDs for blockchain anchor
        const includedLogIds = auditLogs.map(log => log._id.toString());

        // Get timestamp range
        const firstLogTimestamp = auditLogs[0].timestamp;
        const lastLogTimestamp = auditLogs[auditLogs.length - 1].timestamp;

        // Generate Merkle root
        const merkleRoot = generateMerkleRoot(hashes);

        console.log(`✅ Generated Merkle root for farm ${farmerId}: ${merkleRoot.substring(0, 16)}...`);

        return {
            merkleRoot,
            totalLogs: auditLogs.length,
            includedLogIds,
            firstLogTimestamp,
            lastLogTimestamp,
            generatedAt: new Date(),
            farmerId,
        };
    } catch (error) {
        console.error('Error generating Merkle snapshot:', error);
        throw error;
    }
};

/**
 * Batch verify multiple entities using Merkle tree
 * @param {Array<Object>} entities - Array of {entityType, entityId}
 * @returns {Object} - Verification result
 */
export const batchVerifyEntities = async (entities) => {
    try {
        const { verifyHashChain } = await import('../utils/crypto.utils.js');

        const results = [];
        let totalLogs = 0;
        const allHashes = [];

        for (const entity of entities) {
            const auditLogs = await AuditLog.find({
                entityType: entity.entityType,
                entityId: entity.entityId,
            }).sort({ timestamp: 1 }).lean();

            if (auditLogs.length > 0) {
                const verification = verifyHashChain(auditLogs);
                results.push({
                    entityType: entity.entityType,
                    entityId: entity.entityId,
                    isValid: verification.isValid,
                    logCount: auditLogs.length,
                });

                totalLogs += auditLogs.length;
                allHashes.push(...auditLogs.map(log => log.currentHash));
            }
        }

        // Generate Merkle root for all hashes
        const merkleRoot = allHashes.length > 0 ? generateMerkleRoot(allHashes) : null;

        const allValid = results.every(r => r.isValid);

        return {
            isValid: allValid,
            totalEntities: entities.length,
            totalLogs,
            merkleRoot,
            results,
            verifiedAt: new Date(),
        };
    } catch (error) {
        console.error('Error in batch verification:', error);
        throw error;
    }
};

/**
 * Get Merkle proof for a specific audit log
 * Useful for proving a log is part of the Merkle tree
 * @param {ObjectId} auditLogId - Audit log ID
 * @param {ObjectId} farmerId - Farmer ID
 * @returns {Object} - Merkle proof
 */
export const getMerkleProof = async (auditLogId, farmerId) => {
    try {
        const allLogs = await AuditLog.find({ farmerId })
            .sort({ timestamp: 1 })
            .select('_id currentHash')
            .lean();

        const targetIndex = allLogs.findIndex(log => log._id.toString() === auditLogId.toString());

        if (targetIndex === -1) {
            throw new Error('Audit log not found');
        }

        const hashes = allLogs.map(log => log.currentHash);
        const merkleRoot = generateMerkleRoot(hashes);

        // Generate proof path (simplified version)
        const proof = {
            logIndex: targetIndex,
            totalLogs: allLogs.length,
            merkleRoot,
            targetHash: hashes[targetIndex],
            // In a full implementation, include sibling hashes for verification path
        };

        return proof;
    } catch (error) {
        console.error('Error generating Merkle proof:', error);
        throw error;
    }
};

/**
 * Verify farm integrity with Merkle tree
 * @param {ObjectId} farmerId - Farmer ID
 * @returns {Object} - Verification result with Merkle root
 */
export const verifyFarmWithMerkle = async (farmerId) => {
    try {
        const { verifyFarmIntegrity } = await import('../services/auditLog.service.js');

        // Verify hash chain integrity
        const chainVerification = await verifyFarmIntegrity(farmerId);

        // Generate Merkle snapshot
        const merkleSnapshot = await generateFarmMerkleSnapshot(farmerId);

        return {
            ...chainVerification,
            merkleRoot: merkleSnapshot.merkleRoot,
            merkleVerification: {
                totalLogs: merkleSnapshot.totalLogs,
                generatedAt: merkleSnapshot.generatedAt,
            },
        };
    } catch (error) {
        console.error('Error verifying farm with Merkle:', error);
        throw error;
    }
};

/**
 * Generate Merkle snapshot and anchor to blockchain
 * @param {ObjectId} farmerId - Farmer ID
 * @returns {Object} - Snapshot with blockchain data
 */
export const generateAndAnchorFarmSnapshot = async (farmerId) => {
    try {
        // Generate Merkle root (existing code)
        const snapshot = await generateFarmMerkleSnapshot(farmerId);

        if (!snapshot.merkleRoot) {
            return {
                ...snapshot,
                blockchain: null,
                message: 'No logs to anchor'
            };
        }

        // Try to anchor to blockchain
        let blockchainData = null;
        try {
            const { anchorMerkleRoot } = await import('./blockchain.service.js');
            blockchainData = await anchorMerkleRoot(
                snapshot.merkleRoot,
                farmerId.toString(),
                snapshot.totalLogs
            );
            console.log(`✅ Anchored to blockchain: ${blockchainData.transactionHash}`);
        } catch (error) {
            console.warn('⚠️  Blockchain anchoring failed (continuing without it):', error.message);
            // Continue without blockchain - don't fail the whole operation
        }

        // Save blockchain reference in MongoDB (if anchored)
        if (blockchainData) {
            // Get the last audit log to maintain hash chain
            const lastAuditLog = await AuditLog.findOne({ farmerId })
                .sort({ timestamp: -1 })
                .select('currentHash')
                .lean();

            const previousHash = lastAuditLog ? lastAuditLog.currentHash : '0';

            // Import generateChainHash to create unique hash with timestamp
            const { generateChainHash } = await import('../utils/crypto.utils.js');

            const auditData = {
                eventType: 'BLOCKCHAIN_ANCHOR',
                entityType: 'MerkleSnapshot',
                farmerId: farmerId,
                performedByRole: 'System',
                performedByModel: 'System',
                timestamp: new Date(),
                previousHash,
                dataSnapshot: {
                    merkleRoot: snapshot.merkleRoot,
                    totalLogs: snapshot.totalLogs,
                    includedLogIds: snapshot.includedLogIds, // Array of log IDs
                    firstLogTimestamp: snapshot.firstLogTimestamp,
                    lastLogTimestamp: snapshot.lastLogTimestamp,
                    transactionHash: blockchainData.transactionHash,
                    blockNumber: blockchainData.blockNumber,
                    snapshotId: blockchainData.snapshotId,
                    explorerUrl: blockchainData.explorerUrl
                },
                metadata: {
                    blockchain: 'Polygon Amoy',
                    contract: process.env.AUDIT_ANCHOR_ADDRESS,
                    chainId: 80002
                }
            };

            // Generate unique hash for this anchor event
            auditData.currentHash = generateChainHash(previousHash, auditData);

            await AuditLog.create(auditData);
        }

        return { ...snapshot, blockchain: blockchainData };
    } catch (error) {
        console.error('Error anchoring snapshot:', error);
        throw error;
    }
};

