import AuditLog from '../models/auditLog.model.js';
import { generateChainHash, verifyHashChain, signData, verifySignature } from '../utils/crypto.utils.js';

/**
 * Audit Log Service
 * Handles creation and verification of immutable audit logs
 */

/**
 * Get the last hash in the chain for a specific farmer
 * @param {ObjectId} farmerId - Farmer ID
 * @returns {String} - Last hash or '0' for genesis
 */
export const getLastHash = async (farmerId) => {
    try {
        const lastLog = await AuditLog.findOne({ farmerId })
            .sort({ timestamp: -1 })
            .select('currentHash')
            .lean();

        return lastLog ? lastLog.currentHash : '0';
    } catch (error) {
        console.error('Error getting last hash:', error);
        return '0'; // Default to genesis if error
    }
};

/**
 * Create a new audit log entry
 * @param {Object} eventData - Event data
 * @param {String} eventData.eventType - Type of event (CREATE, UPDATE, DELETE, etc.)
 * @param {String} eventData.entityType - Type of entity (Animal, Treatment, etc.)
 * @param {ObjectId} eventData.entityId - ID of the entity
 * @param {ObjectId} eventData.farmerId - ID of the farm
 * @param {ObjectId} eventData.performedBy - ID of user who performed action
 * @param {String} eventData.performedByRole - Role of user (Farmer, Vet, etc.)
 * @param {String} eventData.performedByModel - Model name for performedBy reference
 * @param {Object} eventData.dataSnapshot - Complete state of entity after action
 * @param {Object} eventData.changes - What changed (for updates)
 * @param {Object} eventData.metadata - Additional metadata (signature, IP, etc.)
 * @returns {Object} - Created audit log
 */
export const createAuditLog = async (eventData) => {
    try {
        // Get the last hash in the chain for this farmer
        const previousHash = await getLastHash(eventData.farmerId);

        // Prepare the audit log data
        const auditData = {
            eventType: eventData.eventType,
            entityType: eventData.entityType,
            entityId: eventData.entityId,
            farmerId: eventData.farmerId,
            performedBy: eventData.performedBy,
            performedByRole: eventData.performedByRole,
            performedByModel: eventData.performedByModel || eventData.performedByRole, // Default to role if model not provided
            timestamp: eventData.timestamp || new Date(),
            previousHash: previousHash,
            dataSnapshot: eventData.dataSnapshot,
            changes: eventData.changes || null,
            metadata: eventData.metadata || {},
        };

        // Generate the current hash for this entry
        const currentHash = generateChainHash(previousHash, auditData);
        auditData.currentHash = currentHash;

        // Create the audit log
        const auditLog = await AuditLog.create(auditData);

        console.log(`✅ Audit log created: ${eventData.eventType} ${eventData.entityType} (Hash: ${currentHash.substring(0, 8)}...)`);

        return auditLog;
    } catch (error) {
        console.error('❌ Error creating audit log:', error);
        // Don't throw error - audit logging should not break main operations
        return null;
    }
};

/**
 * Get complete audit trail for an entity
 * @param {String} entityType - Type of entity
 * @param {ObjectId} entityId - ID of entity
 * @returns {Array} - Array of audit logs sorted by timestamp
 */
export const getAuditTrail = async (entityType, entityId) => {
    try {
        const auditLogs = await AuditLog.find({
            entityType,
            entityId,
        })
            .sort({ timestamp: 1 }) // Ascending order for chronological trail
            .populate('performedBy', 'farmOwner fullName email vetId') // Populate user details
            .lean();

        return auditLogs;
    } catch (error) {
        console.error('Error getting audit trail:', error);
        throw error;
    }
};

/**
 * Get all audit logs for a farm
 * @param {ObjectId} farmerId - Farmer ID
 * @param {Object} options - Query options (limit, skip, eventType filter)
 * @returns {Array} - Array of audit logs
 */
export const getFarmAuditLogs = async (farmerId, options = {}) => {
    try {
        const query = { farmerId };

        // Add event type filter if provided
        if (options.eventType) {
            query.eventType = options.eventType;
        }

        // Add entity type filter if provided
        if (options.entityType) {
            query.entityType = options.entityType;
        }

        const auditLogs = await AuditLog.find(query)
            .sort({ timestamp: -1 }) // Descending order for recent first
            .limit(options.limit || 100)
            .skip(options.skip || 0)
            .populate('performedBy', 'farmOwner fullName email vetId')
            .lean();

        return auditLogs;
    } catch (error) {
        console.error('Error getting farm audit logs:', error);
        throw error;
    }
};

/**
 * Verify integrity of audit trail for an entity
 * @param {String} entityType - Type of entity
 * @param {ObjectId} entityId - ID of entity
 * @returns {Object} - Verification result
 */
export const verifyIntegrity = async (entityType, entityId) => {
    try {
        const auditLogs = await AuditLog.find({
            entityType,
            entityId,
        }).sort({ timestamp: 1 }).lean();

        if (auditLogs.length === 0) {
            return {
                isValid: true,
                message: 'No audit logs found for this entity',
                totalLogs: 0,
            };
        }

        // Verify the hash chain
        const verificationResult = verifyHashChain(auditLogs);

        return {
            ...verificationResult,
            totalLogs: auditLogs.length,
            firstLog: auditLogs[0].timestamp,
            lastLog: auditLogs[auditLogs.length - 1].timestamp,
        };
    } catch (error) {
        console.error('Error verifying integrity:', error);
        throw error;
    }
};

/**
 * Verify integrity of entire farm's audit trail
 * @param {ObjectId} farmerId - Farmer ID
 * @returns {Object} - Verification result
 */
export const verifyFarmIntegrity = async (farmerId) => {
    try {
        const auditLogs = await AuditLog.find({ farmerId })
            .sort({ timestamp: 1 })
            .lean();

        if (auditLogs.length === 0) {
            return {
                isValid: true,
                message: 'No audit logs found for this farm',
                totalLogs: 0,
            };
        }

        // Verify the hash chain
        const verificationResult = verifyHashChain(auditLogs);

        return {
            ...verificationResult,
            totalLogs: auditLogs.length,
            firstLog: auditLogs[0].timestamp,
            lastLog: auditLogs[auditLogs.length - 1].timestamp,
        };
    } catch (error) {
        console.error('Error verifying farm integrity:', error);
        throw error;
    }
};

/**
 * Create audit log with digital signature (for critical operations)
 * @param {Object} eventData - Event data (same as createAuditLog)
 * @param {String} privateKey - Private key for signing
 * @returns {Object} - Created audit log with signature
 */
export const createSignedAuditLog = async (eventData, privateKey) => {
    try {
        // Create signature data
        const signatureData = {
            eventType: eventData.eventType,
            entityType: eventData.entityType,
            entityId: eventData.entityId,
            timestamp: eventData.timestamp || new Date(),
            performedBy: eventData.performedBy,
        };

        // Generate signature
        const signature = signData(signatureData, privateKey);

        // Add signature to metadata
        const metadata = {
            ...eventData.metadata,
            signature,
        };

        // Create audit log with signature
        return await createAuditLog({
            ...eventData,
            metadata,
        });
    } catch (error) {
        console.error('Error creating signed audit log:', error);
        return null;
    }
};

/**
 * Verify signature of an audit log
 * @param {Object} auditLog - Audit log to verify
 * @param {String} publicKey - Public key for verification
 * @returns {Boolean} - True if signature is valid
 */
export const verifyAuditSignature = (auditLog, publicKey) => {
    try {
        if (!auditLog.metadata || !auditLog.metadata.signature) {
            return false;
        }

        const signatureData = {
            eventType: auditLog.eventType,
            entityType: auditLog.entityType,
            entityId: auditLog.entityId,
            timestamp: auditLog.timestamp,
            performedBy: auditLog.performedBy,
        };

        return verifySignature(signatureData, auditLog.metadata.signature, publicKey);
    } catch (error) {
        console.error('Error verifying audit signature:', error);
        return false;
    }
};

/**
 * Get recent audit logs across all farms (for admin/regulator dashboard)
 * @param {Number} limit - Number of logs to retrieve
 * @returns {Array} - Array of recent audit logs
 */
export const getRecentAuditLogs = async (limit = 50) => {
    try {
        const auditLogs = await AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('performedBy', 'farmOwner fullName email vetId')
            .populate('farmerId', 'farmOwner location')
            .lean();

        return auditLogs;
    } catch (error) {
        console.error('Error getting recent audit logs:', error);
        throw error;
    }
};
