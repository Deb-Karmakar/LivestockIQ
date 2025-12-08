// Backend/controllers/mrlAnalysis.controller.js
// Controller for regulator MRL analysis endpoints

import LabTestUpload from '../models/labTestUpload.model.js';
import LabTechnician from '../models/labTechnician.model.js';
import Farmer from '../models/farmer.model.js';
import pkg from 'json2csv';
const { Parser } = pkg;

/**
 * @desc    Get comprehensive MRL analysis dashboard data
 * @route   GET /api/regulator/mrl-analysis/dashboard
 * @access  Private (Regulator)
 */
export const getMRLAnalysisDashboard = async (req, res) => {
    try {
        const { startDate, endDate, species, drug, status } = req.query;

        // Build query filters
        let query = {};
        if (startDate && endDate) {
            query.testDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (species) query.animalSpecies = species;
        if (drug) query.drugOrSubstanceTested = { $regex: drug, $options: 'i' };
        if (status && status !== 'all') query.status = status;

        // Get date ranges for trends
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const ninetyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 90));
        const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        // Parallel queries for statistics
        const [
            totalTests,
            passedTests,
            failedTests,
            pendingTests,
            verifiedTests,
            approvedTests,
            rejectedTests,
            testsLast30Days,
            testsLast90Days,
            uniqueLabs,
            uniqueFarms,
            recentTests,
            testsByDrug,
            testsBySpecies,
            testsByMonth,
            passRateByDrug,
            testsByLab,
            failedTestDetails
        ] = await Promise.all([
            LabTestUpload.countDocuments(query),
            LabTestUpload.countDocuments({ ...query, isPassed: true }),
            LabTestUpload.countDocuments({ ...query, isPassed: false }),
            LabTestUpload.countDocuments({ ...query, status: 'Pending Review' }),
            LabTestUpload.countDocuments({ ...query, status: 'Verified' }),
            LabTestUpload.countDocuments({ ...query, status: 'Approved' }),
            LabTestUpload.countDocuments({ ...query, status: 'Rejected' }),
            LabTestUpload.countDocuments({ testDate: { $gte: thirtyDaysAgo } }),
            LabTestUpload.countDocuments({ testDate: { $gte: ninetyDaysAgo } }),
            LabTestUpload.distinct('labName'),
            LabTestUpload.distinct('farmerId'),

            // Recent tests with details
            LabTestUpload.find(query)
                .sort({ testDate: -1 })
                .limit(20)
                .lean(),

            // Tests by drug (top 10)
            LabTestUpload.aggregate([
                { $match: query },
                { $group: { _id: '$drugOrSubstanceTested', count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } },
                { $sort: { count: -1 } },
                { $limit: 15 }
            ]),

            // Tests by species
            LabTestUpload.aggregate([
                { $match: query },
                { $group: { _id: '$animalSpecies', count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } },
                { $sort: { count: -1 } }
            ]),

            // Tests by month (last 12 months)
            LabTestUpload.aggregate([
                { $match: { testDate: { $gte: oneYearAgo } } },
                {
                    $group: {
                        _id: { year: { $year: '$testDate' }, month: { $month: '$testDate' } },
                        count: { $sum: 1 },
                        passed: { $sum: { $cond: ['$isPassed', 1, 0] } },
                        failed: { $sum: { $cond: ['$isPassed', 0, 1] } }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // Pass rate by drug
            LabTestUpload.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$drugOrSubstanceTested',
                        total: { $sum: 1 },
                        passed: { $sum: { $cond: ['$isPassed', 1, 0] } },
                        avgResidueLevel: { $avg: '$residueLevelDetected' },
                        avgMRLThreshold: { $avg: '$mrlThreshold' }
                    }
                },
                { $addFields: { passRate: { $multiply: [{ $divide: ['$passed', '$total'] }, 100] } } },
                { $sort: { passRate: 1 } },
                { $limit: 15 }
            ]),

            // Tests by lab
            LabTestUpload.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$labName',
                        count: { $sum: 1 },
                        passed: { $sum: { $cond: ['$isPassed', 1, 0] } },
                        failed: { $sum: { $cond: ['$isPassed', 0, 1] } }
                    }
                },
                { $addFields: { passRate: { $multiply: [{ $divide: ['$passed', '$count'] }, 100] } } },
                { $sort: { count: -1 } }
            ]),

            // Failed test details for review
            LabTestUpload.find({ ...query, isPassed: false })
                .sort({ testDate: -1 })
                .limit(50)
                .lean()
        ]);

        // Calculate overall pass rate
        const overallPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        // Format monthly trend data
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTrend = testsByMonth.map(m => ({
            month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
            total: m.count,
            passed: m.passed,
            failed: m.failed,
            passRate: m.count > 0 ? ((m.passed / m.count) * 100).toFixed(1) : 0
        }));

        res.json({
            summary: {
                totalTests,
                passedTests,
                failedTests,
                overallPassRate: parseFloat(overallPassRate),
                pendingReview: pendingTests,
                verified: verifiedTests,
                approved: approvedTests,
                rejected: rejectedTests,
                testsLast30Days,
                testsLast90Days,
                uniqueLabs: uniqueLabs.length,
                uniqueFarms: uniqueFarms.length
            },
            charts: {
                testsByDrug: testsByDrug.map(d => ({
                    drug: d._id,
                    total: d.count,
                    passed: d.passed,
                    failed: d.failed,
                    passRate: d.count > 0 ? ((d.passed / d.count) * 100).toFixed(1) : 0
                })),
                testsBySpecies: testsBySpecies.map(s => ({
                    species: s._id || 'Unknown',
                    total: s.count,
                    passed: s.passed,
                    failed: s.failed,
                    passRate: s.count > 0 ? ((s.passed / s.count) * 100).toFixed(1) : 0
                })),
                monthlyTrend,
                passRateByDrug: passRateByDrug.map(d => ({
                    drug: d._id,
                    total: d.total,
                    passed: d.passed,
                    passRate: parseFloat(d.passRate.toFixed(1)),
                    avgResidueLevel: parseFloat(d.avgResidueLevel.toFixed(2)),
                    avgMRLThreshold: parseFloat(d.avgMRLThreshold.toFixed(2))
                })),
                testsByLab: testsByLab.map(l => ({
                    labName: l._id,
                    total: l.count,
                    passed: l.passed,
                    failed: l.failed,
                    passRate: parseFloat(l.passRate.toFixed(1))
                }))
            },
            recentTests,
            failedTests: failedTestDetails
        });

    } catch (error) {
        console.error('Error fetching MRL analysis:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get all lab tests with pagination and filters
 * @route   GET /api/regulator/mrl-analysis/tests
 * @access  Private (Regulator)
 */
export const getAllLabTests = async (req, res) => {
    try {
        const { page = 1, limit = 25, status, isPassed, species, drug, labName, sortBy = 'testDate', sortOrder = 'desc' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};
        if (status && status !== 'all') query.status = status;
        if (isPassed !== undefined && isPassed !== 'all') query.isPassed = isPassed === 'true';
        if (species && species !== 'all') query.animalSpecies = species;
        if (drug) query.drugOrSubstanceTested = { $regex: drug, $options: 'i' };
        if (labName) query.labName = { $regex: labName, $options: 'i' };

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [tests, totalCount] = await Promise.all([
            LabTestUpload.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            LabTestUpload.countDocuments(query)
        ]);

        res.json({
            data: tests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Approve or reject a lab test
 * @route   PATCH /api/regulator/mrl-analysis/tests/:id/review
 * @access  Private (Regulator)
 */
export const reviewLabTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, notes } = req.body; // action: 'approve' | 'reject' | 'flag'

        const test = await LabTestUpload.findById(id);
        if (!test) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        const statusMap = {
            'approve': 'Approved',
            'reject': 'Rejected',
            'verify': 'Verified',
            'flag': 'Flagged'
        };

        test.status = statusMap[action] || test.status;
        test.regulatorReviewed = true;
        test.regulatorReviewedBy = req.user._id;
        test.regulatorReviewDate = new Date();

        if (action === 'flag' && notes) {
            test.flags.push({
                reason: notes,
                flaggedBy: req.user._id,
                flaggedDate: new Date()
            });
        }

        if (notes) {
            test.notes = test.notes ? `${test.notes}\n[Regulator Note]: ${notes}` : `[Regulator Note]: ${notes}`;
        }

        await test.save();

        res.json({ message: `Test ${action}d successfully`, test });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get filter options for dropdowns
 * @route   GET /api/regulator/mrl-analysis/filters
 * @access  Private (Regulator)
 */
export const getFilterOptions = async (req, res) => {
    try {
        const [drugs, species, labs, statuses] = await Promise.all([
            LabTestUpload.distinct('drugOrSubstanceTested'),
            LabTestUpload.distinct('animalSpecies'),
            LabTestUpload.distinct('labName'),
            LabTestUpload.distinct('status')
        ]);

        res.json({
            drugs: drugs.filter(d => d).sort(),
            species: species.filter(s => s).sort(),
            labs: labs.filter(l => l).sort(),
            statuses: statuses.filter(s => s)
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Export MRL data to CSV
 * @route   GET /api/regulator/mrl-analysis/export-csv
 * @access  Private (Regulator)
 */
export const exportMRLDataToCSV = async (req, res) => {
    try {
        const { status, isPassed, species, drug, labName, sortBy = 'testDate', sortOrder = 'desc' } = req.query;

        // Build query (same as getAllLabTests)
        let query = {};
        if (status && status !== 'all') query.status = status;
        if (isPassed !== undefined && isPassed !== 'all') query.isPassed = isPassed === 'true';
        if (species && species !== 'all') query.animalSpecies = species;
        if (drug) query.drugOrSubstanceTested = { $regex: drug, $options: 'i' };
        if (labName) query.labName = { $regex: labName, $options: 'i' };

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Fetch ALL matching tests (no pagination limit)
        const tests = await LabTestUpload.find(query)
            .sort(sortOptions)
            .lean();

        // Define CSV fields
        const fields = [
            { label: 'Test Report Number', value: 'testReportNumber' },
            { label: 'Animal Tag ID', value: 'animalTagId' },
            { label: 'Animal Species', value: 'animalSpecies' },
            { label: 'Farm Name', value: 'farmName' },
            { label: 'Farmer Email', value: 'farmerEmail' },
            { label: 'Drug/Substance Tested', value: 'drugOrSubstanceTested' },
            { label: 'Residue Level Detected', value: 'residueLevelDetected' },
            { label: 'MRL Threshold', value: 'mrlThreshold' },
            { label: 'Unit', value: 'unit' },
            { label: 'Test Result', value: row => row.isPassed ? 'PASS' : 'FAIL' },
            { label: 'Lab Name', value: 'labName' },
            { label: 'Lab Tech ID', value: 'labTechId' },
            { label: 'Test Date', value: row => row.testDate ? new Date(row.testDate).toLocaleDateString() : '' },
            { label: 'Sample Collection Date', value: row => row.sampleCollectionDate ? new Date(row.sampleCollectionDate).toLocaleDateString() : '' },
            { label: 'Status', value: 'status' },
            { label: 'Regulator Reviewed', value: row => row.regulatorReviewed ? 'Yes' : 'No' },
            { label: 'Review Notes', value: 'notes' }
        ];

        // Convert to CSV
        const parser = new Parser({ fields });
        const csv = parser.parse(tests);

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=mrl-analysis-${new Date().toISOString().split('T')[0]}.csv`);

        res.send(csv);

    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

