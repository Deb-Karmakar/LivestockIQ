// Backend/services/regulator.service.js

import RegulatorAlert from '../models/regulatorAlert.model.js';
import Regulator from '../models/regulator.model.js';
import Farmer from '../models/farmer.model.js';
import sendEmail from '../utils/sendEmail.js';
import { sendAlertToRegulators } from '../services/websocket.service.js';
import { format } from 'date-fns';

/**
 * Regulator Notification Service
 * Manages alerts to regulatory authorities for MRL violations and compliance issues
 */

/**
 * Create and send alert to regulators
 */
export const createRegulatorAlert = async (alertData) => {
    try {
        const {
            alertType,
            severity,
            farmerId,
            violationDetails,
            message,
            riskLevel,
            metadata
        } = alertData;

        // Get farmer information
        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            console.error('Farmer not found for regulator alert:', farmerId);
            return null;
        }

        // Create regulator alert
        const alert = await RegulatorAlert.create({
            alertType,
            severity: severity || 'MEDIUM',
            farmerId,
            farmName: farmer.farmName || farmer.farmOwner,
            farmLocation: farmer.location?.state || 'Unknown',
            violationDetails,
            message,
            riskLevel: riskLevel || 'MONITOR',
            metadata: metadata || {},
            status: 'NEW'
        });

        console.log(`✅ Regulator alert created: ${alertType} for farm ${farmer.farmName || farmerId}`);

        // Send WebSocket notification to all connected regulators
        sendAlertToRegulators({
            type: alertType,
            severity,
            title: getAlertTitle(alertType),
            message,
            data: {
                alertId: alert._id.toString(),
                farmName: alert.farmName,
                farmLocation: alert.farmLocation,
                ...violationDetails
            }
        });

        // Send email to all regulators (async, don't wait)
        sendEmailToRegulators(alert).catch(err =>
            console.error('Error sending regulator emails:', err)
        );

        return alert;

    } catch (error) {
        console.error('Error creating regulator alert:', error);
        return null;
    }
};

/**
 * Send MRL violation alert to regulators
 */
export const alertMRLViolation = async (farmerId, violationData) => {
    const { animalId, animalName, drugName, residueLevel, mrlLimit, productType, labTestId } = violationData;

    const exceededBy = residueLevel - mrlLimit;
    const percentageOver = ((exceededBy / mrlLimit) * 100).toFixed(1);

    // Determine severity based on how much limit was exceeded
    let severity = 'MEDIUM';
    let riskLevel = 'MONITOR';

    if (percentageOver > 100) {
        severity = 'CRITICAL';
        riskLevel = 'IMMEDIATE_ACTION';
    } else if (percentageOver > 50) {
        severity = 'HIGH';
        riskLevel = 'HIGH_PRIORITY';
    }

    return await createRegulatorAlert({
        alertType: 'MRL_VIOLATION',
        severity,
        farmerId,
        violationDetails: {
            animalId,
            animalName,
            drugName,
            productType,
            residueLevel,
            mrlLimit,
            exceededBy: exceededBy.toFixed(2),
            percentageOver: parseFloat(percentageOver),
            labTestId,
            testDate: new Date()
        },
        message: `MRL violation detected: ${drugName} in ${animalName} (${productType}) - ${percentageOver}% over limit`,
        riskLevel
    });
};

/**
 * Alert regulators of repeated violations by same farm
 */
export const alertRepeatedViolation = async (farmerId, violationCount, timeWindow = '30 days') => {
    let severity = 'MEDIUM';
    let riskLevel = 'MONITOR';

    if (violationCount >= 5) {
        severity = 'CRITICAL';
        riskLevel = 'IMMEDIATE_ACTION';
    } else if (violationCount >= 3) {
        severity = 'HIGH';
        riskLevel = 'HIGH_PRIORITY';
    }

    return await createRegulatorAlert({
        alertType: 'REPEATED_VIOLATION',
        severity,
        farmerId,
        violationDetails: {
            violationCount,
            timeWindow
        },
        message: `Repeated violations detected: ${violationCount} violations in ${timeWindow}`,
        riskLevel
    });
};

/**
 * Alert regulators of blocked sale attempt
 */
export const alertBlockedSaleAttempt = async (farmerId, saleData) => {
    const { animalId, animalName, productType, quantity, blockReason } = saleData;

    // Blocked sales are concerning - farmer tried to sell non-compliant product
    const severity = blockReason === 'MRL_VIOLATION' ? 'HIGH' : 'MEDIUM';
    const riskLevel = blockReason === 'MRL_VIOLATION' ? 'HIGH_PRIORITY' : 'MONITOR';

    return await createRegulatorAlert({
        alertType: 'BLOCKED_SALE_ATTEMPT',
        severity,
        farmerId,
        violationDetails: {
            animalId,
            animalName,
            productType,
            productQuantity: quantity,
            attemptedSaleDate: new Date()
        },
        message: `Blocked sale attempt: Farmer tried to sell ${productType} from ${animalName} (Reason: ${blockReason})`,
        riskLevel,
        metadata: {
            blockReason
        }
    });
};

/**
 * Check for compliance patterns and alert if needed
 */
export const checkCompliancePatterns = async (farmerId) => {
    try {
        // Get recent alerts for this farm (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const recentAlerts = await RegulatorAlert.find({
            farmerId,
            createdAt: { $gte: ninetyDaysAgo }
        });

        // Check for concerning patterns
        const violationAlerts = recentAlerts.filter(a => a.alertType === 'MRL_VIOLATION');
        const blockedSaleAlerts = recentAlerts.filter(a => a.alertType === 'BLOCKED_SALE_ATTEMPT');

        // Pattern 1: Multiple MRL violations
        if (violationAlerts.length >= 3) {
            await alertRepeatedViolation(farmerId, violationAlerts.length, '90 days');
        }

        // Pattern 2: Frequent sale blocking (suggests deliberate non-compliance)
        if (blockedSaleAlerts.length >= 5) {
            await createRegulatorAlert({
                alertType: 'COMPLIANCE_PATTERN',
                severity: 'HIGH',
                farmerId,
                violationDetails: {
                    violationCount: blockedSaleAlerts.length,
                    timeWindow: '90 days'
                },
                message: `Compliance pattern detected: ${blockedSaleAlerts.length} blocked sale attempts in 90 days`,
                riskLevel: 'HIGH_PRIORITY'
            });
        }

    } catch (error) {
        console.error('Error checking compliance patterns:', error);
    }
};

/**
 * Send email to all regulators about alert
 */
const sendEmailToRegulators = async (alert) => {
    try {
        // Get all regulators with email addresses
        const regulators = await Regulator.find({
            email: { $exists: true, $ne: null, $ne: '' }
        });

        if (regulators.length === 0) {
            console.log('⚠️ No regulators with email addresses found');
            return;
        }

        const farmer = await Farmer.findById(alert.farmerId);

        // Build email HTML
        const htmlContent = buildRegulatorEmailHTML(alert, farmer);

        // Send to all regulators
        const emailPromises = regulators.map(regulator =>
            sendEmail({
                to: regulator.email,
                subject: getEmailSubject(alert),
                html: htmlContent,
                retries: 2
            })
        );

        const results = await Promise.allSettled(emailPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

        console.log(`📧 Regulator emails sent: ${successCount}/${regulators.length} successful`);

        // Update alert with email status
        alert.emailSent = successCount > 0;
        alert.emailSentAt = new Date();
        alert.emailRecipients = regulators.map(r => r.email);
        await alert.save();

    } catch (error) {
        console.error('Error sending regulator emails:', error);
    }
};

/**
 * Build HTML email for regulators
 */
const buildRegulatorEmailHTML = (alert, farmer) => {
    const severityColor = {
        'CRITICAL': '#dc2626',
        'HIGH': '#f59e0b',
        'MEDIUM': '#10b981',
        'LOW': '#6b7280'
    }[alert.severity] || '#6b7280';

    const riskBadge = {
        'IMMEDIATE_ACTION': '🚨 IMMEDIATE ACTION REQUIRED',
        'HIGH_PRIORITY': '⚠️ HIGH PRIORITY',
        'MONITOR': '📊 MONITORING REQUIRED',
        'LOW_RISK': 'ℹ️ LOW RISK'
    }[alert.riskLevel] || 'ALERT';

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: ${severityColor}; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #6b7280; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .badge { display: inline-block; padding: 10px 20px; background: #fef3c7; color: #92400e; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Compliance Alert</h1>
            <p>${alert.alertType.replace(/_/g, ' ')}</p>
        </div>
        <div class="content">
            <div class="badge">${riskBadge}</div>
            
            <h3>Farm Information</h3>
            <div class="detail-row">
                <span class="label">Farm Name:</span>
                <span class="value">${farmer?.farmName || farmer?.farmOwner || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${farmer?.location?.state || 'Unknown'}, ${farmer?.location?.district || ''}</span>
            </div>
            <div class="detail-row">
                <span class="label">Contact:</span>
                <span class="value">${farmer?.phoneNumber || 'N/A'}</span>
            </div>

            <h3>Violation Details</h3>
            <div class="detail-row">
                <span class="label">Alert Type:</span>
                <span class="value">${alert.alertType}</span>
            </div>
            <div class="detail-row">
                <span class="label">Severity:</span>
                <span class="value" style="color: ${severityColor};">${alert.severity}</span>
            </div>
            <div class="detail-row">
                <span class="label">Message:</span>
                <span class="value">${alert.message}</span>
            </div>

            ${alert.violationDetails.drugName ? `
            <div class="detail-row">
                <span class="label">Drug:</span>
                <span class="value">${alert.violationDetails.drugName}</span>
            </div>
            ` : ''}

            ${alert.violationDetails.residueLevel ? `
            <div class="detail-row">
                <span class="label">Residue Level:</span>
                <span class="value">${alert.violationDetails.residueLevel} µg/kg (Limit: ${alert.violationDetails.mrlLimit} µg/kg)</span>
            </div>
            <div class="detail-row">
                <span class="label">Exceeded By:</span>
                <span class="value">${alert.violationDetails.percentageOver}%</span>
            </div>
            ` : ''}

            <div class="detail-row">
                <span class="label">Alert Time:</span>
                <span class="value">${format(alert.createdAt, 'dd MMM yyyy, HH:mm')}</span>
            </div>

            <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 5px;">
                <strong>Action Required:</strong> Please investigate this violation and take appropriate regulatory action.
            </p>
        </div>
        <div class="footer">
            <p><strong>LivestockIQ Compliance Monitoring System</strong></p>
            <p>This is an automated alert. Login to the portal for full details.</p>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Get email subject based on alert type
 */
const getEmailSubject = (alert) => {
    const prefix = alert.severity === 'CRITICAL' ? '🚨 URGENT' : '⚠️';
    return `${prefix}: ${alert.alertType.replace(/_/g, ' ')} - ${alert.farmName}`;
};

/**
 * Get alert title for display
 */
const getAlertTitle = (alertType) => {
    const titles = {
        'MRL_VIOLATION': 'MRL Violation Detected',
        'REPEATED_VIOLATION': 'Repeated Violations',
        'BLOCKED_SALE_ATTEMPT': 'Non-Compliant Sale Attempt Blocked',
        'MISSING_MRL_TEST': 'Missing MRL Test',
        'EXPIRED_TEST_DETECTED': 'Expired Test Results Used',
        'COMPLIANCE_PATTERN': 'Compliance Pattern Detected'
    };
    return titles[alertType] || 'Compliance Alert';
};
