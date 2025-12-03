import { axiosInstance } from '../contexts/AuthContext';

// Get recent audit logs (Admin/Regulator only)
export const getRecentAudits = async (limit = 50) => {
    const response = await axiosInstance.get(`/audit/recent?limit=${limit}`);
    return response.data.data;
};

// Get audit trail for a specific entity
export const getEntityAuditTrail = async (entityType, entityId) => {
    const response = await axiosInstance.get(`/audit/trail/${entityType}/${entityId}`);
    return response.data.data;
};

// Verify integrity of an entity
export const verifyEntityIntegrity = async (entityType, entityId) => {
    const response = await axiosInstance.get(`/audit/verify/${entityType}/${entityId}`);
    return response.data.verification;
};

// Blockchain verification functions
export const verifyLogOnBlockchain = async (logId) => {
    const response = await axiosInstance.get(`/audit/verify-blockchain/${logId}`);
    return response.data;
};

export const getBlockchainSnapshots = async (farmerId) => {
    const response = await axiosInstance.get(`/audit/blockchain-snapshots/${farmerId}`);
    return response.data.data;
};

export const getBlockchainProof = async (logId) => {
    const response = await axiosInstance.get(`/audit/blockchain-proof/${logId}`);
    return response.data.data;
};

export const getFarmAuditTrail = async (farmerId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);
    if (options.eventType) params.append('eventType', options.eventType);
    if (options.entityType) params.append('entityType', options.entityType);

    const response = await axiosInstance.get(`/audit/farm/${farmerId}?${params.toString()}`);
    return response.data.data;
};

