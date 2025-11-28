// Backend/controllers/email.controller.js

import { sendTestEmail, sendWithdrawalAlert, sendMRLViolationAlert, sendWeeklySummary } from '../services/notification.service.js';
import Treatment from '../models/treatment.model.js';
import LabTest from '../models/labTest.model.js';

/**
 * Email Testing and Manual Trigger Controller
 */

// @desc    Send test email to verify email configuration
// @route   POST /api/email/test
// @access  Private (Admin)
export const testEmailConfiguration = async (req, res) => {
    try {
        const { recipientEmail } = req.body;

        if (!recipientEmail) {
            return res.status(400).json({ message: 'Please provide recipientEmail' });
        }

        const result = await sendTestEmail(recipientEmail);

        if (result.success) {
            res.status(200).json({
                message: 'Test email sent successfully!',
                recipientEmail,
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Manually trigger withdrawal alert email
// @route   POST /api/email/withdrawal-alert
// @access  Private (Admin/Testing)
export const triggerWithdrawalAlert = async (req, res) => {
    try {
        const { treatmentId } = req.body;

        if (!treatmentId) {
            return res.status(400).json({ message: 'Please provide treatmentId' });
        }

        const treatment = await Treatment.findById(treatmentId);
        if (!treatment) {
            return res.status(404).json({ message: 'Treatment not found' });
        }

        const result = await sendWithdrawalAlert(
            treatment.farmerId,
            treatment.animalId,
            treatment
        );

        if (result.success) {
            res.status(200).json({
                message: 'Withdrawal alert email sent successfully!',
                result
            });
        } else {
            res.status(500).json({
                message: 'Failed to send withdrawal alert',
                error: result.error || result.reason
            });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Manually trigger MRL violation alert email
// @route   POST /api/email/mrl-violation-alert
// @access  Private (Admin/Testing)
export const triggerMRLViolationAlert = async (req, res) => {
    try {
        const { labTestId } = req.body;

        if (!labTestId) {
            return res.status(400).json({ message: 'Please provide labTestId' });
        }

        const labTest = await LabTest.findById(labTestId);
        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        const result = await sendMRLViolationAlert(labTest.farmerId, labTest);

        if (result.success) {
            res.status(200).json({
                message: 'MRL violation alert email sent successfully!',
                result
            });
        } else {
            res.status(500).json({
                message: 'Failed to send MRL violation alert',
                error: result.error || result.reason
            });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Manually trigger weekly summary email
// @route   POST /api/email/weekly-summary
// @access  Private (Admin/Testing)
export const triggerWeeklySummary = async (req, res) => {
    try {
        const { farmerId } = req.body;

        if (!farmerId) {
            // If no farmerId provided, send to the logged-in user (if admin is testing)
            const targetFarmerId = farmerId || req.user._id;

            const result = await sendWeeklySummary(targetFarmerId);

            if (result.success) {
                res.status(200).json({
                    message: 'Weekly summary email sent successfully!',
                    result
                });
            } else {
                res.status(500).json({
                    message: 'Failed to send weekly summary',
                    error: result.error || result.reason
                });
            }
        } else {
            const result = await sendWeeklySummary(farmerId);

            if (result.success) {
                res.status(200).json({
                    message: 'Weekly summary email sent successfully!',
                    result
                });
            } else {
                res.status(500).json({
                    message: 'Failed to send weekly summary',
                    error: result.error || result.reason
                });
            }
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
