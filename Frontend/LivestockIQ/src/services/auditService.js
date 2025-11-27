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
