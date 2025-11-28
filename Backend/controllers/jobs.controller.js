// Backend/controllers/jobs.controller.js

import { checkWithdrawalPeriods } from '../jobs/withdrawalAlerts.js';
import { sendWeeklySummaries } from '../jobs/weeklySummary.js';
import { checkOverdueMRLTests } from '../jobs/mrlTestReminders.js';

/**
 * Manual Job Trigger Controller
 * Allows admins to manually trigger scheduled jobs for testing
 */

// @desc    Manually trigger withdrawal period check
// @route   POST /api/jobs/withdrawal-check
// @access  Private (Admin)
export const triggerWithdrawalCheck = async (req, res) => {
    try {
        console.log('🔧 Manually triggering withdrawal period check...');
        await checkWithdrawalPeriods();
        res.json({
            message: 'Withdrawal period check completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error running withdrawal check',
            error: error.message
        });
    }
};

// @desc    Manually trigger weekly summaries
// @route   POST /api/jobs/weekly-summaries
// @access  Private (Admin)
export const triggerWeeklySummaries = async (req, res) => {
    try {
        console.log('🔧 Manually triggering weekly summaries...');
        await sendWeeklySummaries();
        res.json({
            message: 'Weekly summaries sent successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error sending weekly summaries',
            error: error.message
        });
    }
};

// @desc    Manually trigger MRL test reminders
// @route   POST /api/jobs/mrl-reminders
// @access  Private (Admin)
export const triggerMRLReminders = async (req, res) => {
    try {
        console.log('🔧 Manually triggering MRL test reminders...');
        await checkOverdueMRLTests();
        res.json({
            message: 'MRL test reminders sent successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error sending MRL reminders',
            error: error.message
        });
    }
};

// @desc    Get job status and schedule info
// @route   GET /api/jobs/status
// @access  Private (Admin)
export const getJobStatus = async (req, res) => {
    try {
        res.json({
            jobs: [
                {
                    name: 'Withdrawal Period Alerts',
                    schedule: 'Daily at 8:00 AM',
                    cronExpression: '0 8 * * *',
                    description: 'Checks for treatments at 7, 3, 1, 0 day marks and sends alerts',
                    endpoint: '/api/jobs/withdrawal-check'
                },
                {
                    name: 'Weekly Farm Summaries',
                    schedule: 'Every Sunday at 6:00 PM',
                    cronExpression: '0 18 * * 0',
                    description: 'Sends weekly farm health statistics to all farmers',
                    endpoint: '/api/jobs/weekly-summaries'
                },
                {
                    name: 'MRL Test Reminders',
                    schedule: 'Daily at 10:00 AM',
                    cronExpression: '0 10 * * *',
                    description: 'Reminds farmers to test animals with completed withdrawal periods',
                    endpoint: '/api/jobs/mrl-reminders'
                },
                {
                    name: 'AMU Analysis',
                    schedule: 'Daily at midnight',
                    cronExpression: '0 0 * * *',
                    description: 'Analyzes antimicrobial usage patterns',
                    status: 'Running (existing job)'
                },
                {
                    name: 'Disease Prediction',
                    schedule: 'Daily at 1:00 AM',
                    cronExpression: '0 1 * * *',
                    description: 'AI-powered disease outbreak predictions',
                    status: 'Running (existing job)'
                },
                {
                    name: 'Blockchain Anchoring',
                    schedule: 'Every 6 hours',
                    cronExpression: '0 */6 * * *',
                    description: 'Anchors farm data to blockchain',
                    status: 'Running (existing job)'
                }
            ],
            serverUptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching job status',
            error: error.message
        });
    }
};
