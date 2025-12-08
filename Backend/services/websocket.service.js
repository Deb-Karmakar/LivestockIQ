// Backend/services/websocket.service.js

/**
 * WebSocket Real-time Alert Service
 * Manages Socket.io connections and broadcasts alerts to connected clients
 */

let io = null;

/**
 * Initialize Socket.io instance
 * Called from server.js after HTTP server creation
 */
export const initializeWebSocket = (socketIoInstance) => {
    io = socketIoInstance;
    console.log('✅ WebSocket service initialized');
};

/**
 * Get Socket.io instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeWebSocket first.');
    }
    return io;
};

/**
 * Send alert to specific farmer
 * @param {string} farmerId - Farmer's MongoDB ID
 * @param {Object} alert - Alert object
 */
export const sendAlertToFarmer = (farmerId, alert) => {
    try {
        if (!io) {
            console.warn('⚠️ Socket.io not initialized, skipping WebSocket alert');
            return;
        }

        const room = `farmer:${farmerId}`;
        io.to(room).emit('alert', {
            ...alert,
            timestamp: new Date().toISOString(),
            recipient: 'farmer'
        });

        console.log(`📡 WebSocket alert sent to farmer ${farmerId}:`, alert.type);
    } catch (error) {
        console.error('Error sending WebSocket alert to farmer:', error);
    }
};

/**
 * Send alert to specific veterinarian
 * @param {string} vetId - Vet's ID
 * @param {Object} alert - Alert object
 */
export const sendAlertToVet = (vetId, alert) => {
    try {
        if (!io) return;

        const room = `vet:${vetId}`;
        io.to(room).emit('alert', {
            ...alert,
            timestamp: new Date().toISOString(),
            recipient: 'vet'
        });

        console.log(`📡 WebSocket alert sent to vet ${vetId}:`, alert.type);
    } catch (error) {
        console.error('Error sending WebSocket alert to vet:', error);
    }
};

/**
 * Send alert to all regulators
 * @param {Object} alert - Alert object
 */
export const sendAlertToRegulators = (alert) => {
    try {
        if (!io) return;

        io.to('regulators').emit('alert', {
            ...alert,
            timestamp: new Date().toISOString(),
            recipient: 'regulator'
        });

        console.log(`📡 WebSocket alert sent to regulators:`, alert.type);
    } catch (error) {
        console.error('Error sending WebSocket alert to regulators:', error);
    }
};

/**
 * Broadcast alert to all connected clients
 * @param {Object} alert - Alert object
 */
export const broadcastAlert = (alert) => {
    try {
        if (!io) return;

        io.emit('alert', {
            ...alert,
            timestamp: new Date().toISOString(),
            broadcast: true
        });

        console.log(`📡 WebSocket broadcast:`, alert.type);
    } catch (error) {
        console.error('Error broadcasting WebSocket alert:', error);
    }
};

/**
 * Send MRL violation alert
 */
export const sendMRLViolationAlert = (farmerId, data) => {
    sendAlertToFarmer(farmerId, {
        type: 'MRL_VIOLATION',
        severity: 'critical',
        title: 'MRL Violation Detected',
        message: `Animal ${data.animalName} has exceeded MRL limits`,
        data: {
            animalId: data.animalId,
            animalName: data.animalName,
            drugName: data.drugName,
            residueLevel: data.residueLevel,
            mrlLimit: data.mrlLimit,
            exceededBy: data.exceededBy
        },
        action: {
            type: 'navigate',
            url: '/farmer/mrl-compliance'
        }
    });

    // Also notify regulators
    sendAlertToRegulators({
        type: 'MRL_VIOLATION',
        severity: 'critical',
        title: 'MRL Violation Detected',
        message: `Farm ${data.farmName || farmerId} reported MRL violation`,
        data: {
            farmerId,
            animalId: data.animalId,
            drugName: data.drugName,
            violationLevel: data.exceededBy
        }
    });
};

/**
 * Send withdrawal period alert
 */
export const sendWithdrawalPeriodAlert = (farmerId, data) => {
    const severity = data.daysRemaining <= 1 ? 'urgent' :
        data.daysRemaining <= 3 ? 'warning' : 'info';

    const emoji = data.daysRemaining <= 1 ? '🚨' :
        data.daysRemaining <= 3 ? '⚠️' : '⏰';

    sendAlertToFarmer(farmerId, {
        type: 'WITHDRAWAL_PERIOD',
        severity,
        title: `${emoji} Withdrawal Period Alert`,
        message: `Animal ${data.animalName} - ${data.daysRemaining} days remaining`,
        data: {
            animalId: data.animalId,
            animalName: data.animalName,
            drugName: data.drugName,
            daysRemaining: data.daysRemaining,
            withdrawalEndDate: data.withdrawalEndDate
        },
        action: {
            type: 'navigate',
            url: '/farmer/treatments'
        }
    });
};

/**
 * Send treatment approval/rejection alert
 */
export const sendTreatmentStatusAlert = (farmerId, data) => {
    const isApproved = data.status === 'Approved';

    sendAlertToFarmer(farmerId, {
        type: 'TREATMENT_STATUS',
        severity: isApproved ? 'success' : 'warning',
        title: isApproved ? 'Treatment Approved' : 'Treatment Rejected',
        message: `Treatment for ${data.animalName} has been ${data.status.toLowerCase()}`,
        data: {
            treatmentId: data.treatmentId,
            animalId: data.animalId,
            animalName: data.animalName,
            drugName: data.drugName,
            status: data.status,
            vetName: data.vetName,
            approvalDate: data.approvalDate
        },
        action: {
            type: 'navigate',
            url: `/farmer/treatments/${data.treatmentId}`
        }
    });
};

/**
 * Send new treatment request alert to vet
 */
export const sendTreatmentRequestAlert = (vetId, data) => {
    sendAlertToVet(vetId, {
        type: 'TREATMENT_REQUEST',
        severity: 'info',
        title: 'New Treatment Request',
        message: `${data.farmerName} requested treatment for ${data.animalName}`,
        data: {
            treatmentId: data.treatmentId,
            farmerId: data.farmerId,
            farmerName: data.farmerName,
            animalId: data.animalId,
            animalName: data.animalName,
            symptoms: data.symptoms
        },
        action: {
            type: 'navigate',
            url: '/vet/treatment-requests'
        }
    });
};

/**
 * Send lab test result alert
 */
export const sendLabTestResultAlert = (farmerId, data) => {
    const isPassed = data.isPassed;

    sendAlertToFarmer(farmerId, {
        type: 'LAB_TEST_RESULT',
        severity: isPassed ? 'success' : 'critical',
        title: isPassed ? '✅ MRL Test Passed' : '🚨 MRL Test Failed',
        message: `Lab test for ${data.animalName}: ${isPassed ? 'PASSED' : 'FAILED'}`,
        data: {
            testId: data.testId,
            animalId: data.animalId,
            animalName: data.animalName,
            drugName: data.drugName,
            isPassed,
            residueLevel: data.residueLevel,
            mrlLimit: data.mrlLimit
        },
        action: {
            type: 'navigate',
            url: '/farmer/mrl-compliance'
        }
    });
};

/**
 * Send sale blocked alert
 */
export const sendSaleBlockedAlert = (farmerId, data) => {
    sendAlertToFarmer(farmerId, {
        type: 'SALE_BLOCKED',
        severity: 'critical',
        title: '⛔ Sale Blocked',
        message: `Cannot sell products from ${data.animalName}: ${data.reason}`,
        data: {
            animalId: data.animalId,
            animalName: data.animalName,
            reason: data.reason,
            blockReason: data.blockReason,
            actionRequired: data.actionRequired
        },
        action: {
            type: 'navigate',
            url: '/farmer/animals'
        }
    });
};

/**
 * Send weekly summary notification
 */
export const sendWeeklySummaryAlert = (farmerId, data) => {
    sendAlertToFarmer(farmerId, {
        type: 'WEEKLY_SUMMARY',
        severity: 'info',
        title: '📊 Weekly Farm Summary',
        message: `Your weekly report is ready`,
        data: {
            totalAnimals: data.totalAnimals,
            treatmentsThisWeek: data.treatmentsThisWeek,
            animalsUnderWithdrawal: data.animalsUnderWithdrawal,
            safeToSell: data.safeToSell
        },
        action: {
            type: 'navigate',
            url: '/farmer/dashboard'
        }
    });
};

/**
 * Send vet visit request alert to vet
 */
export const sendVetVisitRequestAlert = (vetId, data) => {
    sendAlertToVet(vetId, {
        type: 'VET_VISIT_REQUEST',
        severity: data.urgency === 'Emergency' ? 'critical' : data.urgency === 'Urgent' ? 'warning' : 'info',
        title: '🏥 New Farm Visit Request',
        message: `${data.farmerName} requested a visit for ${data.animalName}`,
        data: {
            visitRequestId: data.visitRequestId,
            farmerId: data.farmerId,
            farmerName: data.farmerName,
            farmName: data.farmName,
            animalId: data.animalId,
            animalName: data.animalName,
            reason: data.reason,
            urgency: data.urgency
        },
        action: {
            type: 'navigate',
            url: '/vet/visit-requests'
        }
    });
};

/**
 * Send vet visit response alert to farmer
 */
export const sendVetVisitResponseAlert = (farmerId, data) => {
    const isAccepted = data.status === 'Accepted';

    sendAlertToFarmer(farmerId, {
        type: 'VET_VISIT_RESPONSE',
        severity: isAccepted ? 'success' : 'warning',
        title: isAccepted ? '✅ Vet Visit Scheduled' : '❌ Vet Visit Declined',
        message: isAccepted
            ? `${data.vetName} will visit on ${new Date(data.scheduledDate).toLocaleDateString()}`
            : `${data.vetName} declined the visit request`,
        data: {
            visitRequestId: data.visitRequestId,
            animalId: data.animalId,
            animalName: data.animalName,
            status: data.status,
            scheduledDate: data.scheduledDate,
            vetName: data.vetName,
            vetNotes: data.vetNotes
        },
        action: {
            type: 'navigate',
            url: '/farmer/animals'
        }
    });
};
