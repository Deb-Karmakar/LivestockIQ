// backend/controllers/regulator.controller.js

import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Regulator from '../models/regulator.model.js';
import Treatment from '../models/treatment.model.js';
import ComplianceAlert from '../models/complianceAlert.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import Animal from '../models/animal.model.js';
import AmuConfig from '../models/amuConfig.model.js';
import { subMonths, format, subDays } from 'date-fns';
import PDFDocument from 'pdfkit';
import * as amuStats from '../services/amuStatistics.service.js';
import FeedAdministration from '../models/feedAdministration.model.js';

export const getDashboardStats = async (req, res) => {
    try {
        const sixMonthsAgo = subMonths(new Date(), 6);

        const [
            farmCount, vetCount, complianceStatsRaw, amuTrendRaw, heatmapRawData
        ] = await Promise.all([
            Farmer.countDocuments(),
            Veterinarian.countDocuments(),
            Treatment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: sixMonthsAgo } } },
                { $group: { _id: { month: { $month: '$startDate' }, year: { $year: '$startDate' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Treatment.aggregate([
                { $match: { status: 'Approved' } },
                { $group: { _id: '$farmerId', intensity: { $sum: 1 } } },
                { $lookup: { from: 'farmers', localField: '_id', foreignField: '_id', as: 'farmerInfo' } },
                { $unwind: '$farmerInfo' },
                // UPDATED: This now checks for BOTH latitude and longitude
                {
                    $match: {
                        'farmerInfo.location.latitude': { $exists: true, $ne: null },
                        'farmerInfo.location.longitude': { $exists: true, $ne: null }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        lat: '$farmerInfo.location.latitude',
                        lng: '$farmerInfo.location.longitude',
                        intensity: '$intensity'
                    }
                }
            ])
        ]);

        // --- Process the raw data for the frontend ---
        const complianceStats = { approved: 0, pending: 0, rejected: 0 };
        complianceStatsRaw.forEach(stat => {
            if (stat._id) {
                const statusKey = stat._id.toLowerCase();
                if (complianceStats.hasOwnProperty(statusKey)) {
                    complianceStats[statusKey] = stat.count;
                }
            }
        });

        const amuTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthName = format(date, 'MMM');
            const monthNum = parseInt(format(date, 'M'));
            const yearNum = parseInt(format(date, 'yyyy'));
            const monthData = amuTrendRaw.find(d => d._id.month === monthNum && d._id.year === yearNum);
            amuTrend.push({ name: monthName, treatments: monthData ? monthData.count : 0 });
        }

        const heatmapData = heatmapRawData.map(item => [item.lat, item.lng, item.intensity * 100]);

        res.json({
            overviewStats: {
                totalFarms: farmCount,
                totalVets: vetCount,
                totalTreatments: complianceStats.approved + complianceStats.pending + complianceStats.rejected,
            },
            complianceStats,
            amuTrend,
            heatmapData,
        });

    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getComplianceData = async (req, res) => {
    try {
        const sevenDaysAgo = subDays(new Date(), 7);
        const sixMonthsAgo = subMonths(new Date(), 6);

        const [
            complianceStatsRaw,
            overdueCount,
            flaggedFarms,
            complianceTrendRaw,
            alerts
        ] = await Promise.all([
            // This query already fetches all statuses, including 'Rejected'
            Treatment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Treatment.countDocuments({ status: 'Pending', createdAt: { $lte: sevenDaysAgo } }),
            ComplianceAlert.distinct('farmerId', { status: 'Open' }),
            Treatment.aggregate([
                { $match: { status: 'Pending', createdAt: { $gte: sixMonthsAgo, $lte: new Date() } } },
                { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            ComplianceAlert.find({ status: 'Open' })
                .populate('farmerId', 'farmName')
                .populate('vetId', 'fullName')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        // UPDATED: Processing logic now includes the 'Rejected' count
        const complianceStats = { approved: 0, pending: 0, rejected: 0 };
        complianceStatsRaw.forEach(stat => {
            if (stat._id) { // Ensure status is not null
                const statusKey = stat._id.toLowerCase();
                if (complianceStats.hasOwnProperty(statusKey)) {
                    complianceStats[statusKey] = stat.count;
                }
            }
        });
        const totalVerified = complianceStats.approved;
        // UPDATED: The denominator now includes all three statuses
        const total = complianceStats.approved + complianceStats.pending + complianceStats.rejected;
        const complianceRate = total > 0 ? ((totalVerified / total) * 100).toFixed(1) : 100;

        const complianceTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthData = complianceTrendRaw.find(d => d._id.month === (date.getMonth() + 1) && d._id.year === date.getFullYear());
            complianceTrend.push({
                month: format(date, 'MMM'),
                overdue: monthData ? monthData.count : 0,
            });
        }

        res.json({
            complianceStats: {
                complianceRate: parseFloat(complianceRate),
                pendingVerifications: complianceStats.pending,
                overdueVerifications: overdueCount,
                farmsFlagged: flaggedFarms.length,
            },
            complianceTrend,
            alerts: alerts.map(alert => ({
                id: alert._id,
                farmName: alert.farmerId.farmName,
                vetName: alert.vetId.fullName,
                issue: alert.reason,
                date: alert.createdAt,
                severity: 'High'
            }))
        });

    } catch (error) {
        console.error("Error in getComplianceData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getTrendAnalysisData = async (req, res) => {
    try {
        const twelveMonthsAgo = subMonths(new Date(), 12);

        // Run both complex queries concurrently
        const [amuByDrugRaw, amuBySpeciesRaw] = await Promise.all([
            // Query 1: Group treatments by drug name and month
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: twelveMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' },
                            drugName: '$drugName'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            // Query 2: Group treatments by animal species and month
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: twelveMonthsAgo } } },
                {
                    $lookup: {
                        from: 'animals', // The name of the Animal collection
                        localField: 'animalId',
                        foreignField: 'tagId',
                        as: 'animalInfo'
                    }
                },
                { $unwind: '$animalInfo' },
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' },
                            species: '$animalInfo.species'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // Helper function to process and pivot the aggregated data for charts
        const processDataForChart = (rawData, categoryField) => {
            const dataMap = new Map();
            const categories = new Set();

            rawData.forEach(item => {
                const monthName = format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy');
                const category = item._id[categoryField];
                categories.add(category);

                if (!dataMap.has(monthName)) {
                    dataMap.set(monthName, { name: format(new Date(item._id.year, item._id.month - 1), 'MMM') });
                }
                dataMap.get(monthName)[category] = item.count;
            });
            return { data: Array.from(dataMap.values()), keys: Array.from(categories) };
        };

        const amuByDrug = processDataForChart(amuByDrugRaw, 'drugName');
        const amuBySpecies = processDataForChart(amuBySpeciesRaw, 'species');

        res.json({ amuByDrug, amuBySpecies });

    } catch (error) {
        console.error("Error in getTrendAnalysisData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getDemographicsData = async (req, res) => {
    try {
        // UPDATED: Added speciesGenderRaw to the Promise.all call
        const [
            herdCompositionRaw,
            ageDistributionRaw,
            speciesGenderRaw // NEW: Query for the new table
        ] = await Promise.all([
            // Query 1: Group animals by species (unchanged)
            Animal.aggregate([
                { $group: { _id: '$species', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Query 2: Group animals into age buckets (unchanged)
            Animal.aggregate([
                { $project: { age: { $divide: [{ $subtract: [new Date(), '$dob'] }, (365 * 24 * 60 * 60 * 1000)] } } },
                { $bucket: { groupBy: "$age", boundaries: [0, 1, 3, 5, 10, Infinity], default: "Unknown", output: { "count": { $sum: 1 } } } }
            ]),
            // NEW: Query 3: Group animals by both species and gender
            Animal.aggregate([
                { $match: { species: { $ne: null }, gender: { $ne: null } } },
                { $group: { _id: { species: '$species', gender: '$gender' }, count: { $sum: 1 } } }
            ])
        ]);

        // Process herd composition for the pie chart (unchanged)
        const herdComposition = herdCompositionRaw.map(item => ({
            name: item._id,
            value: item.count
        }));

        // Process age distribution for the bar chart (unchanged)
        const ageLabels = ['0-1 Years', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'];
        const ageDistribution = ageDistributionRaw.map((bucket, index) => ({
            name: ageLabels[index] || 'Unknown',
            count: bucket.count
        }));

        // NEW: Process the raw gender data into the table format
        const speciesGenderMap = {};
        speciesGenderRaw.forEach(item => {
            const { species, gender } = item._id;
            const count = item.count;

            if (!speciesGenderMap[species]) {
                speciesGenderMap[species] = { species: species, total: 0, Male: 0, Female: 0 };
            }

            speciesGenderMap[species].total += count;
            // Ensure we only count recognized genders to avoid extra columns
            if (gender === 'Male' || gender === 'Female') {
                speciesGenderMap[species][gender] += count;
            }
        });

        const speciesGenderBreakdown = Object.values(speciesGenderMap).sort((a, b) => b.total - a.total);

        res.json({ herdComposition, ageDistribution, speciesGenderBreakdown });

    } catch (error) {
        console.error("Error in getDemographicsData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getMapData = async (req, res) => {
    try {
        const sixMonthsAgo = subMonths(new Date(), 6);

        // 1. Fetch Config and Data
        const [config, farms, vets, openComplianceAlerts, activeAmuAlerts, treatmentCounts, feedCounts, mrlViolations, herdSizeCounts] = await Promise.all([
            AmuConfig.findOne({ isActive: true }),
            Farmer.find({
                'location.latitude': { $exists: true, $ne: null },
                'location.longitude': { $exists: true, $ne: null }
            }).select('farmName farmOwner location phoneNumber'), // Removed static herdSize

            Veterinarian.find({
                'location.latitude': { $exists: true, $ne: null },
                'location.longitude': { $exists: true, $ne: null }
            }).select('fullName specialization licenseNumber location phoneNumber'),

            // 2. Fetch Open Compliance Alerts
            ComplianceAlert.find({ status: 'Open' }).select('farmerId reason severity'),

            // 3. Fetch Active High AMU Alerts
            HighAmuAlert.find({ status: 'New' }).select('farmerId alertDate'),

            // 4. Calculate AMU Intensity (Treatments in last 6 months)
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: sixMonthsAgo } } },
                { $group: { _id: '$farmerId', count: { $sum: 1 } } }
            ]),

            // 5. Calculate Feed AMU (Animals on medicated feed in last 6 months)
            FeedAdministration.aggregate([
                {
                    $match: {
                        vetApproved: true,
                        administrationDate: { $gte: sixMonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: '$farmerId',
                        count: { $sum: '$numberOfAnimals' }
                    }
                }
            ]),

            // 6. Fetch Active MRL Violations
            Animal.find({ mrlStatus: 'VIOLATION' }).select('farmerId tagId'),

            // 7. Calculate Dynamic Herd Size (Active Animals)
            Animal.aggregate([
                { $match: { status: 'Active' } },
                { $group: { _id: '$farmerId', count: { $sum: 1 } } }
            ])
        ]);

        const amuThreshold = config?.absoluteIntensityThreshold || 0.5;

        // --- Process and Merge Data for Farms ---
        const enhancedFarms = farms.map(farm => {
            const farmIdStr = farm._id.toString();

            // Check for Alerts
            const farmComplianceAlerts = openComplianceAlerts.filter(a => a.farmerId.toString() === farmIdStr);
            const farmAmuAlerts = activeAmuAlerts.filter(a => a.farmerId.toString() === farmIdStr);
            const farmMrlViolations = mrlViolations.filter(a => a.farmerId.toString() === farmIdStr);

            // Get Dynamic Herd Size
            const activeAnimalCount = herdSizeCounts.find(h => h._id.toString() === farmIdStr)?.count || 0;
            const herdSize = activeAnimalCount > 0 ? activeAnimalCount : 1; // Prevent division by zero, default to 1 if no animals

            // Calculate AMU Intensity
            const tCount = treatmentCounts.find(t => t._id.toString() === farmIdStr)?.count || 0;
            const fCount = feedCounts.find(f => f._id.toString() === farmIdStr)?.count || 0;
            const totalEvents = tCount + fCount;
            const amuIntensity = parseFloat((totalEvents / herdSize).toFixed(2));

            // Determine Status
            let status = 'Good';
            let latestIssue = null;

            if (farmMrlViolations.length > 0) {
                status = 'Critical';
                latestIssue = 'Active MRL Violation';
            } else if (farmComplianceAlerts.length > 0) {
                status = 'Critical';
                latestIssue = farmComplianceAlerts[0].reason;
            } else if (farmAmuAlerts.length > 0) {
                status = 'Warning';
                latestIssue = 'High Antimicrobial Usage (Alert)';
            } else if (amuIntensity > amuThreshold) {
                status = 'Warning';
                latestIssue = `High AMU Intensity (> ${amuThreshold})`;
            }

            return {
                ...farm.toObject(),
                status,
                amuIntensity,
                herdSize,
                amuBreakdown: {
                    treatments: tCount,
                    feed: fCount
                },
                activeAlerts: {
                    compliance: farmComplianceAlerts.length,
                    amu: farmAmuAlerts.length,
                    mrlViolations: farmMrlViolations.length
                },
                latestIssue
            };
        });

        res.json({ farms: enhancedFarms, vets, meta: { amuThreshold } });

    } catch (error) {
        console.error("Error in getMapData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const generateComplianceReport = async (req, res) => {
    try {
        const { from, to } = req.body;
        const startDate = new Date(from);
        const endDate = new Date(to);

        // Fetch all necessary data concurrently
        const [treatments, alerts] = await Promise.all([
            Treatment.find({ createdAt: { $gte: startDate, $lte: endDate } }),
            ComplianceAlert.find({ createdAt: { $gte: startDate, $lte: endDate } })
                .populate('farmerId', 'farmName farmOwner')
                .populate('vetId', 'fullName')
                .sort({ createdAt: -1 })
        ]);

        // --- Calculate Statistics ---
        const stats = { approved: 0, pending: 0, rejected: 0 };
        treatments.forEach(t => {
            if (stats.hasOwnProperty(t.status.toLowerCase())) {
                stats[t.status.toLowerCase()]++;
            }
        });
        const totalRecords = stats.approved + stats.pending + stats.rejected;
        const complianceRate = totalRecords > 0 ? ((stats.approved / totalRecords) * 100).toFixed(1) : 100;

        // --- PDF Generation ---
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Compliance_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        });

        // Header
        doc.fillColor('#228B22').fontSize(24).font('Helvetica-Bold').text('LivestockIQ', 50, 50);
        doc.fillColor('#000000').fontSize(12).font('Helvetica');
        doc.moveDown(2);
        doc.fontSize(20).font('Helvetica-Bold').text('Official Compliance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Report Period: ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`);
        doc.moveDown(2);

        // Section 1: Statistical Summary
        doc.fontSize(14).font('Helvetica-Bold').text('Statistical Summary');
        doc.fontSize(10).font('Helvetica').list([
            `Total Treatment Records Submitted: ${totalRecords}`,
            `Approved Records: ${stats.approved}`,
            `Pending Vet Review: ${stats.pending}`,
            `Rejected Records: ${stats.rejected}`,
            `Overall Compliance Rate: ${complianceRate}%`,
            `Total Non-Compliance Alerts Filed: ${alerts.length}`,
        ]);
        doc.moveDown(2);

        // Section 2: Detailed Non-Compliance Alerts
        doc.fontSize(14).font('Helvetica-Bold').text('Non-Compliance Alerts Log');
        doc.moveDown();
        if (alerts.length > 0) {
            const tableTop = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Date', 50, tableTop);
            doc.text('Farm Name', 150, tableTop);
            doc.text('Reason', 300, tableTop);
            doc.text('Reporting Vet', 450, tableTop);
            doc.font('Helvetica');

            let y = tableTop + 20;
            alerts.forEach(alert => {
                doc.text(format(new Date(alert.createdAt), 'P'), 50, y);
                doc.text(alert.farmerId.farmName, 150, y, { width: 140 });
                doc.text(alert.reason, 300, y, { width: 140 });
                doc.text(alert.vetId.fullName, 450, y, { width: 100 });
                y += 30; // Increased spacing for readability
                if (y > 700) { doc.addPage(); y = 50; }
            });
        } else {
            doc.fontSize(10).font('Helvetica').text('No non-compliance alerts were filed during this period.');
        }

        doc.end();

    } catch (error) {
        console.error("Error generating compliance report:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getRegulatorProfile = async (req, res) => {
    const regulator = await Regulator.findById(req.user._id).select('-password');
    if (regulator) {
        res.json(regulator);
    } else {
        res.status(404).json({ message: 'Regulator not found' });
    }
};

// NEW: Function to update the profile of the logged-in regulator
export const updateRegulatorProfile = async (req, res) => {
    try {
        const regulator = await Regulator.findById(req.user._id);

        if (regulator) {
            // Only allow specific fields to be updated
            regulator.phoneNumber = req.body.phoneNumber ?? regulator.phoneNumber;

            if (req.body.notificationPrefs) {
                regulator.notificationPrefs = { ...regulator.notificationPrefs, ...req.body.notificationPrefs };
            }

            const updatedRegulator = await regulator.save();
            res.json(updatedRegulator);
        } else {
            res.status(404).json({ message: 'Regulator not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getHighAmuAlerts = async (req, res) => {
    try {
        const alerts = await HighAmuAlert.find({ status: 'New' })
            .populate('farmerId', 'farmName farmOwner')
            .sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const generateReport = async (req, res) => {
    try {
        const { from, to, type } = req.body;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${type}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        });

        // Common Header
        doc.fillColor('#228B22').fontSize(24).font('Helvetica-Bold').text('LivestockIQ', 50, 50);
        doc.fillColor('#000000').fontSize(12).font('Helvetica');
        doc.moveDown(2);
        doc.fontSize(20).font('Helvetica-Bold').text(`${type.replace(/([A-Z])/g, ' $1').trim()} Report`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Report Period: ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`);
        doc.moveDown(2);

        switch (type) {
            case 'Compliance':
                await generateComplianceReportContent(doc, startDate, endDate);
                break;
            case 'AmuTrends':
                await generateAmuTrendsReportContent(doc, startDate, endDate);
                break;
            case 'WhoAware':
                await generateWhoAwareReportContent(doc, startDate, endDate);
                break;
            case 'VetOversight':
                await generateVetOversightReportContent(doc, startDate, endDate);
                break;
            case 'FarmRisk':
                await generateFarmRiskReportContent(doc, startDate, endDate);
                break;
            case 'FeedVsTherapeutic':
                await generateFeedVsTherapeuticReportContent(doc, startDate, endDate);
                break;
            default:
                doc.text('Invalid Report Type Selected.');
        }

        doc.end();

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// --- Helper Functions for Report Content ---

const generateComplianceReportContent = async (doc, startDate, endDate) => {
    const [treatments, alerts] = await Promise.all([
        Treatment.find({ createdAt: { $gte: startDate, $lte: endDate } }),
        ComplianceAlert.find({ createdAt: { $gte: startDate, $lte: endDate } })
            .populate('farmerId', 'farmName farmOwner')
            .populate('vetId', 'fullName')
            .sort({ createdAt: -1 })
    ]);

    const stats = { approved: 0, pending: 0, rejected: 0 };
    treatments.forEach(t => {
        if (stats.hasOwnProperty(t.status.toLowerCase())) {
            stats[t.status.toLowerCase()]++;
        }
    });
    const totalRecords = stats.approved + stats.pending + stats.rejected;
    const complianceRate = totalRecords > 0 ? ((stats.approved / totalRecords) * 100).toFixed(1) : 100;

    doc.fontSize(14).font('Helvetica-Bold').text('Statistical Summary');
    doc.fontSize(10).font('Helvetica').list([
        `Total Treatment Records Submitted: ${totalRecords}`,
        `Approved Records: ${stats.approved}`,
        `Pending Vet Review: ${stats.pending}`,
        `Rejected Records: ${stats.rejected}`,
        `Overall Compliance Rate: ${complianceRate}%`,
        `Total Non-Compliance Alerts Filed: ${alerts.length}`,
    ]);
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica-Bold').text('Non-Compliance Alerts Log');
    doc.moveDown();
    if (alerts.length > 0) {
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', 50, tableTop);
        doc.text('Farm Name', 150, tableTop);
        doc.text('Reason', 300, tableTop);
        doc.text('Reporting Vet', 450, tableTop);
        doc.font('Helvetica');

        let y = tableTop + 20;
        alerts.forEach(alert => {
            doc.text(format(new Date(alert.createdAt), 'P'), 50, y);
            doc.text(alert.farmerId.farmName, 150, y, { width: 140 });
            doc.text(alert.reason, 300, y, { width: 140 });
            doc.text(alert.vetId.fullName, 450, y, { width: 100 });
            y += 30; // Increased spacing for readability
            if (y > 700) { doc.addPage(); y = 50; }
        });
    } else {
        doc.fontSize(10).font('Helvetica').text('No non-compliance alerts were filed during this period.');
    }
};

const generateAmuTrendsReportContent = async (doc, startDate, endDate) => {
    const treatments = await Treatment.aggregate([
        { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$drugName', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    doc.fontSize(14).font('Helvetica-Bold').text('Antimicrobial Usage by Drug');
    doc.moveDown();

    if (treatments.length > 0) {
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Drug Name', 50, tableTop);
        doc.text('Total Treatments', 400, tableTop);
        doc.font('Helvetica');

        let y = tableTop + 20;
        treatments.forEach(t => {
            doc.text(t._id, 50, y);
            doc.text(t.count.toString(), 400, y);
            y += 20;
            if (y > 700) { doc.addPage(); y = 50; }
        });
    } else {
        doc.fontSize(10).font('Helvetica').text('No treatment records found for this period.');
    }
};

const generateWhoAwareReportContent = async (doc, startDate, endDate) => {
    const treatments = await Treatment.aggregate([
        { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$drugClass', count: { $sum: 1 } } }
    ]);

    const stats = { Access: 0, Watch: 0, Reserve: 0, Unclassified: 0 };
    treatments.forEach(t => {
        if (stats.hasOwnProperty(t._id)) {
            stats[t._id] = t.count;
        }
    });

    doc.fontSize(14).font('Helvetica-Bold').text('WHO AWaRe Classification Summary');
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').list([
        `Access Group (Low Risk): ${stats.Access}`,
        `Watch Group (High Risk): ${stats.Watch}`,
        `Reserve Group (Last Resort): ${stats.Reserve}`,
        `Unclassified: ${stats.Unclassified}`,
    ]);

    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Oblique').text('Note: "Watch" and "Reserve" categories require strict monitoring to prevent antimicrobial resistance.');
};

const generateVetOversightReportContent = async (doc, startDate, endDate) => {
    const vetStats = await Treatment.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: '$vetId',
                approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
                rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
                total: { $sum: 1 }
            }
        },
        { $lookup: { from: 'veterinarians', localField: '_id', foreignField: 'licenseNumber', as: 'vetInfo' } }, // Assuming vetId matches licenseNumber or similar unique ID
        { $unwind: { path: '$vetInfo', preserveNullAndEmptyArrays: true } }
    ]);

    doc.fontSize(14).font('Helvetica-Bold').text('Veterinarian Oversight Performance');
    doc.moveDown();

    if (vetStats.length > 0) {
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Veterinarian', 50, tableTop);
        doc.text('Approved', 250, tableTop);
        doc.text('Rejected', 350, tableTop);
        doc.text('Total', 450, tableTop);
        doc.font('Helvetica');

        let y = tableTop + 20;
        vetStats.forEach(v => {
            const vetName = v.vetInfo ? v.vetInfo.fullName : `Unknown (${v._id})`;
            doc.text(vetName, 50, y, { width: 180 });
            doc.text(v.approved.toString(), 250, y);
            doc.text(v.rejected.toString(), 350, y);
            doc.text(v.total.toString(), 450, y);
            y += 20;
            if (y > 700) { doc.addPage(); y = 50; }
        });
    } else {
        doc.fontSize(10).font('Helvetica').text('No veterinarian activity recorded for this period.');
    }
};

const generateFarmRiskReportContent = async (doc, startDate, endDate) => {
    // Identify farms with high AMU intensity or frequent alerts
    const [highAmuFarms, alertCounts] = await Promise.all([
        Treatment.aggregate([
            { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: '$farmerId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'farmers', localField: '_id', foreignField: '_id', as: 'farmerInfo' } },
            { $unwind: '$farmerInfo' }
        ]),
        ComplianceAlert.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: '$farmerId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'farmers', localField: '_id', foreignField: '_id', as: 'farmerInfo' } },
            { $unwind: '$farmerInfo' }
        ])
    ]);

    doc.fontSize(14).font('Helvetica-Bold').text('Top 10 Farms by AMU Intensity');
    doc.moveDown();
    if (highAmuFarms.length > 0) {
        highAmuFarms.forEach((f, i) => {
            doc.fontSize(10).font('Helvetica').text(`${i + 1}. ${f.farmerInfo.farmName} - ${f.count} Treatments`);
        });
    } else {
        doc.text('No data available.');
    }

    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('Top 10 Farms by Compliance Alerts');
    doc.moveDown();
    if (alertCounts.length > 0) {
        alertCounts.forEach((f, i) => {
            doc.fontSize(10).font('Helvetica').text(`${i + 1}. ${f.farmerInfo.farmName} - ${f.count} Alerts`);
        });
    } else {
        doc.text('No data available.');
    }
};

const generateFeedVsTherapeuticReportContent = async (doc, startDate, endDate) => {
    const [treatmentCount, feedCount] = await Promise.all([
        Treatment.countDocuments({ status: 'Approved', startDate: { $gte: startDate, $lte: endDate } }),
        FeedAdministration.aggregate([
            { $match: { vetApproved: true, administrationDate: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, totalAnimals: { $sum: '$numberOfAnimals' } } }
        ])
    ]);

    const totalFeedAnimals = feedCount.length > 0 ? feedCount[0].totalAnimals : 0;

    doc.fontSize(14).font('Helvetica-Bold').text('Route of Administration Comparison');
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').list([
        `Individual Treatments (Therapeutic): ${treatmentCount} animals treated`,
        `Medicated Feed (Prophylactic/Metaphylactic): ${totalFeedAnimals} animals treated`
    ]);

    doc.moveDown();
    doc.text('High usage of medicated feed may indicate routine prophylactic use, which should be minimized under stewardship guidelines.');
};