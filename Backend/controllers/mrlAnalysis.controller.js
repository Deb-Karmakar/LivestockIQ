// Backend/controllers/mrlAnalysis.controller.js
// Controller for regulator MRL analysis endpoints
// MERGED: Now queries BOTH LabTest (real uploads) AND LabTestUpload (seed data)

import LabTest from '../models/labTest.model.js';
import LabTestUpload from '../models/labTestUpload.model.js';
import Animal from '../models/animal.model.js';
import Farmer from '../models/farmer.model.js';
import pkg from 'json2csv';
const { Parser } = pkg;

// Helper: Normalize LabTest to common format
const normalizeLabTest = (t) => ({
    ...t,
    drugOrSubstanceTested: t.drugName || t.drugOrSubstanceTested,
    animalTagId: t.animalId || t.animalTagId,
    farmName: t.farmerId?.farmName || t.farmName || 'Unknown Farm',
    farmerName: t.farmerId?.farmOwner || t.farmerName || 'Unknown',
    animalSpecies: t.animalSpecies || 'Unknown',
    source: 'LabTest'
});

// Helper: Normalize LabTestUpload to common format
const normalizeLabTestUpload = (t) => ({
    ...t,
    drugName: t.drugOrSubstanceTested,
    animalId: t.animalTagId,
    source: 'LabTestUpload'
});

/**
 * @desc    Get comprehensive MRL analysis dashboard data
 * @route   GET /api/regulator/mrl-analysis/dashboard
 * @access  Private (Regulator)
 */
export const getMRLAnalysisDashboard = async (req, res) => {
    try {
        const { startDate, endDate, species, drug, status } = req.query;

        // Build query filters for LabTest
        let queryLabTest = {};
        let queryLabTestUpload = {};

        if (startDate && endDate) {
            queryLabTest.testDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            queryLabTestUpload.testDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (drug) {
            queryLabTest.drugName = { $regex: drug, $options: 'i' };
            queryLabTestUpload.drugOrSubstanceTested = { $regex: drug, $options: 'i' };
        }
        if (status && status !== 'all') {
            queryLabTest.status = status;
            queryLabTestUpload.status = status;
        }

        // Get date ranges for trends
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const ninetyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 90));
        const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        // Query BOTH collections in parallel
        const [
            // Counts from LabTest (real uploads)
            lt_total, lt_passed, lt_failed, lt_pending, lt_verified, lt_approved, lt_rejected,
            lt_30days, lt_90days, lt_labs, lt_farms, lt_recent, lt_failedDetails,
            // Counts from LabTestUpload (seed data)
            ltu_total, ltu_passed, ltu_failed, ltu_pending, ltu_verified, ltu_approved, ltu_rejected,
            ltu_30days, ltu_90days, ltu_labs, ltu_farms, ltu_recent, ltu_failedDetails,
            // Aggregations from both
            lt_byDrug, ltu_byDrug, lt_byMonth, ltu_byMonth, lt_byLab, ltu_byLab,
            lt_passRateByDrug, ltu_passRateByDrug, lt_bySpecies, ltu_bySpecies
        ] = await Promise.all([
            // LabTest counts
            LabTest.countDocuments(queryLabTest),
            LabTest.countDocuments({ ...queryLabTest, isPassed: true }),
            LabTest.countDocuments({ ...queryLabTest, isPassed: false }),
            LabTest.countDocuments({ ...queryLabTest, status: 'Pending Verification' }),
            LabTest.countDocuments({ ...queryLabTest, status: 'Verified' }),
            LabTest.countDocuments({ ...queryLabTest, status: 'Approved' }),
            LabTest.countDocuments({ ...queryLabTest, status: 'Rejected' }),
            LabTest.countDocuments({ testDate: { $gte: thirtyDaysAgo } }),
            LabTest.countDocuments({ testDate: { $gte: ninetyDaysAgo } }),
            LabTest.distinct('labName'),
            LabTest.distinct('farmerId'),
            LabTest.find(queryLabTest).populate('farmerId', 'farmOwner farmName').sort({ testDate: -1 }).limit(10).lean(),
            LabTest.find({ ...queryLabTest, isPassed: false }).populate('farmerId', 'farmOwner farmName').sort({ testDate: -1 }).limit(25).lean(),

            // LabTestUpload counts
            LabTestUpload.countDocuments(queryLabTestUpload),
            LabTestUpload.countDocuments({ ...queryLabTestUpload, isPassed: true }),
            LabTestUpload.countDocuments({ ...queryLabTestUpload, isPassed: false }),
            LabTestUpload.countDocuments({ ...queryLabTestUpload, status: 'Pending Review' }),
            LabTestUpload.countDocuments({ ...queryLabTestUpload, status: 'Verified' }),
            LabTestUpload.countDocuments({ ...queryLabTestUpload, status: 'Approved' }),
            LabTestUpload.countDocuments({ ...queryLabTestUpload, status: 'Rejected' }),
            LabTestUpload.countDocuments({ testDate: { $gte: thirtyDaysAgo } }),
            LabTestUpload.countDocuments({ testDate: { $gte: ninetyDaysAgo } }),
            LabTestUpload.distinct('labName'),
            LabTestUpload.distinct('farmerId'),
            LabTestUpload.find(queryLabTestUpload).sort({ testDate: -1 }).limit(10).lean(),
            LabTestUpload.find({ ...queryLabTestUpload, isPassed: false }).sort({ testDate: -1 }).limit(25).lean(),

            // LabTest aggregations
            LabTest.aggregate([{ $match: queryLabTest }, { $group: { _id: '$drugName', count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } }, { $sort: { count: -1 } }, { $limit: 15 }]),
            LabTestUpload.aggregate([{ $match: queryLabTestUpload }, { $group: { _id: '$drugOrSubstanceTested', count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } }, { $sort: { count: -1 } }, { $limit: 15 }]),
            LabTest.aggregate([{ $match: { testDate: { $gte: oneYearAgo } } }, { $group: { _id: { year: { $year: '$testDate' }, month: { $month: '$testDate' } }, count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
            LabTestUpload.aggregate([{ $match: { testDate: { $gte: oneYearAgo } } }, { $group: { _id: { year: { $year: '$testDate' }, month: { $month: '$testDate' } }, count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
            LabTest.aggregate([{ $match: queryLabTest }, { $group: { _id: '$labName', count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } }, { $addFields: { passRate: { $multiply: [{ $divide: ['$passed', '$count'] }, 100] } } }, { $sort: { count: -1 } }]),
            LabTestUpload.aggregate([{ $match: queryLabTestUpload }, { $group: { _id: '$labName', count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } }, { $addFields: { passRate: { $multiply: [{ $divide: ['$passed', '$count'] }, 100] } } }, { $sort: { count: -1 } }]),
            LabTest.aggregate([{ $match: queryLabTest }, { $group: { _id: '$drugName', total: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, avgResidueLevel: { $avg: '$residueLevelDetected' }, avgMRLThreshold: { $avg: '$mrlThreshold' } } }, { $addFields: { passRate: { $multiply: [{ $divide: ['$passed', '$total'] }, 100] } } }, { $sort: { passRate: 1 } }, { $limit: 15 }]),
            LabTestUpload.aggregate([{ $match: queryLabTestUpload }, { $group: { _id: '$drugOrSubstanceTested', total: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, avgResidueLevel: { $avg: '$residueLevelDetected' }, avgMRLThreshold: { $avg: '$mrlThreshold' } } }, { $addFields: { passRate: { $multiply: [{ $divide: ['$passed', '$total'] }, 100] } } }, { $sort: { passRate: 1 } }, { $limit: 15 }]),
            LabTest.aggregate([{ $match: queryLabTest }, { $lookup: { from: 'animals', localField: 'animalId', foreignField: 'tagId', as: 'animalInfo' } }, { $unwind: { path: '$animalInfo', preserveNullAndEmptyArrays: true } }, { $group: { _id: { $ifNull: ['$animalInfo.species', 'Unknown'] }, count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } }, { $sort: { count: -1 } }]),
            LabTestUpload.aggregate([{ $match: queryLabTestUpload }, { $group: { _id: '$animalSpecies', count: { $sum: 1 }, passed: { $sum: { $cond: ['$isPassed', 1, 0] } }, failed: { $sum: { $cond: ['$isPassed', 0, 1] } } } }, { $sort: { count: -1 } }])
        ]);

        // Merge counts
        const totalTests = lt_total + ltu_total;
        const passedTests = lt_passed + ltu_passed;
        const failedTests = lt_failed + ltu_failed;
        const pendingTests = lt_pending + ltu_pending;
        const verifiedTests = lt_verified + ltu_verified;
        const approvedTests = lt_approved + ltu_approved;
        const rejectedTests = lt_rejected + ltu_rejected;
        const testsLast30Days = lt_30days + ltu_30days;
        const testsLast90Days = lt_90days + ltu_90days;
        const uniqueLabs = [...new Set([...lt_labs, ...ltu_labs])];
        const uniqueFarms = [...new Set([...lt_farms.map(f => f?.toString()), ...ltu_farms.map(f => f?.toString())])];

        // Merge recent tests (normalize and combine)
        const recentTests = [
            ...lt_recent.map(normalizeLabTest),
            ...ltu_recent.map(normalizeLabTestUpload)
        ].sort((a, b) => new Date(b.testDate) - new Date(a.testDate)).slice(0, 20);

        // Merge failed test details
        const failedTestDetails = [
            ...lt_failedDetails.map(normalizeLabTest),
            ...ltu_failedDetails.map(normalizeLabTestUpload)
        ].sort((a, b) => new Date(b.testDate) - new Date(a.testDate)).slice(0, 50);

        // Merge drug aggregations
        const drugMap = new Map();
        [...lt_byDrug, ...ltu_byDrug].forEach(d => {
            const key = d._id;
            if (drugMap.has(key)) {
                const existing = drugMap.get(key);
                existing.count += d.count;
                existing.passed += d.passed;
                existing.failed += d.failed;
            } else {
                drugMap.set(key, { ...d });
            }
        });
        const testsByDrug = Array.from(drugMap.values()).sort((a, b) => b.count - a.count).slice(0, 15);

        // Merge species aggregations
        const speciesMap = new Map();
        [...lt_bySpecies, ...ltu_bySpecies].forEach(s => {
            const key = s._id || 'Unknown';
            if (speciesMap.has(key)) {
                const existing = speciesMap.get(key);
                existing.count += s.count;
                existing.passed += s.passed;
                existing.failed += s.failed;
            } else {
                speciesMap.set(key, { ...s });
            }
        });
        const testsBySpecies = Array.from(speciesMap.values()).sort((a, b) => b.count - a.count);

        // Merge monthly trends
        const monthMap = new Map();
        [...lt_byMonth, ...ltu_byMonth].forEach(m => {
            const key = `${m._id.year}-${m._id.month}`;
            if (monthMap.has(key)) {
                const existing = monthMap.get(key);
                existing.count += m.count;
                existing.passed += m.passed;
                existing.failed += m.failed;
            } else {
                monthMap.set(key, { ...m });
            }
        });
        const testsByMonth = Array.from(monthMap.values()).sort((a, b) => a._id.year - b._id.year || a._id.month - b._id.month);

        // Merge lab aggregations
        const labMap = new Map();
        [...lt_byLab, ...ltu_byLab].forEach(l => {
            const key = l._id;
            if (labMap.has(key)) {
                const existing = labMap.get(key);
                existing.count += l.count;
                existing.passed += l.passed;
                existing.failed += l.failed;
            } else {
                labMap.set(key, { ...l });
            }
        });
        const testsByLab = Array.from(labMap.values()).map(l => ({
            ...l,
            passRate: l.count > 0 ? (l.passed / l.count) * 100 : 0
        })).sort((a, b) => b.count - a.count);

        // Merge pass rate by drug
        const passRateMap = new Map();
        [...lt_passRateByDrug, ...ltu_passRateByDrug].forEach(d => {
            const key = d._id;
            if (passRateMap.has(key)) {
                const existing = passRateMap.get(key);
                existing.total += d.total;
                existing.passed += d.passed;
                existing.avgResidueLevel = (existing.avgResidueLevel + d.avgResidueLevel) / 2;
                existing.avgMRLThreshold = (existing.avgMRLThreshold + d.avgMRLThreshold) / 2;
            } else {
                passRateMap.set(key, { ...d });
            }
        });
        const passRateByDrug = Array.from(passRateMap.values()).map(d => ({
            ...d,
            passRate: d.total > 0 ? (d.passed / d.total) * 100 : 0
        })).sort((a, b) => a.passRate - b.passRate).slice(0, 15);

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
            // Transform tests to use frontend-expected field names
            recentTests: recentTests.map(t => ({
                ...t,
                drugOrSubstanceTested: t.drugName,
                animalTagId: t.animalId,
                farmName: t.farmerId?.farmName || 'Unknown Farm',
                farmerName: t.farmerId?.farmOwner || 'Unknown'
            })),
            failedTests: failedTestDetails.map(t => ({
                ...t,
                drugOrSubstanceTested: t.drugName,
                animalTagId: t.animalId,
                farmName: t.farmerId?.farmName || 'Unknown Farm',
                farmerName: t.farmerId?.farmOwner || 'Unknown'
            }))
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

        // Build queries for both collections
        let queryLabTest = {};
        let queryLabTestUpload = {};

        if (status && status !== 'all') {
            queryLabTest.status = status;
            queryLabTestUpload.status = status;
        }
        if (isPassed !== undefined && isPassed !== 'all') {
            queryLabTest.isPassed = isPassed === 'true';
            queryLabTestUpload.isPassed = isPassed === 'true';
        }
        if (drug) {
            queryLabTest.drugName = { $regex: drug, $options: 'i' };
            queryLabTestUpload.drugOrSubstanceTested = { $regex: drug, $options: 'i' };
        }
        if (labName) {
            queryLabTest.labName = { $regex: labName, $options: 'i' };
            queryLabTestUpload.labName = { $regex: labName, $options: 'i' };
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Query both collections
        const [ltTests, ltuTests, ltCount, ltuCount] = await Promise.all([
            LabTest.find(queryLabTest).populate('farmerId', 'farmOwner farmName email').sort(sortOptions).lean(),
            LabTestUpload.find(queryLabTestUpload).sort(sortOptions).lean(),
            LabTest.countDocuments(queryLabTest),
            LabTestUpload.countDocuments(queryLabTestUpload)
        ]);

        // Merge and normalize all tests
        const allTests = [
            ...ltTests.map(normalizeLabTest),
            ...ltuTests.map(normalizeLabTestUpload)
        ].sort((a, b) => {
            const aVal = a[sortBy] || 0;
            const bVal = b[sortBy] || 0;
            return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (bVal > aVal ? 1 : -1);
        });

        // Apply pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedTests = allTests.slice(skip, skip + parseInt(limit));
        const totalCount = ltCount + ltuCount;

        res.json({
            data: paginatedTests,
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

        const test = await LabTest.findById(id);
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
        // Query both collections for filter options
        const [ltDrugs, ltLabs, ltStatuses, ltuDrugs, ltuLabs, ltuStatuses, ltuSpecies] = await Promise.all([
            LabTest.distinct('drugName'),
            LabTest.distinct('labName'),
            LabTest.distinct('status'),
            LabTestUpload.distinct('drugOrSubstanceTested'),
            LabTestUpload.distinct('labName'),
            LabTestUpload.distinct('status'),
            LabTestUpload.distinct('animalSpecies')
        ]);

        // Get species from animals related to LabTest (needs lookup)
        const animalTagIds = await LabTest.distinct('animalId');
        const ltSpecies = await Animal.distinct('species', { tagId: { $in: animalTagIds } });

        // Merge unique values from both collections
        const drugs = [...new Set([...ltDrugs, ...ltuDrugs])].filter(d => d).sort();
        const species = [...new Set([...ltSpecies, ...ltuSpecies])].filter(s => s).sort();
        const labs = [...new Set([...ltLabs, ...ltuLabs])].filter(l => l).sort();
        const statuses = [...new Set([...ltStatuses, ...ltuStatuses])].filter(s => s);

        res.json({ drugs, species, labs, statuses });

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
        const { status, isPassed, drug, labName, sortBy = 'testDate', sortOrder = 'desc' } = req.query;

        // Build queries for both collections
        let queryLabTest = {};
        let queryLabTestUpload = {};

        if (status && status !== 'all') {
            queryLabTest.status = status;
            queryLabTestUpload.status = status;
        }
        if (isPassed !== undefined && isPassed !== 'all') {
            queryLabTest.isPassed = isPassed === 'true';
            queryLabTestUpload.isPassed = isPassed === 'true';
        }
        if (drug) {
            queryLabTest.drugName = { $regex: drug, $options: 'i' };
            queryLabTestUpload.drugOrSubstanceTested = { $regex: drug, $options: 'i' };
        }
        if (labName) {
            queryLabTest.labName = { $regex: labName, $options: 'i' };
            queryLabTestUpload.labName = { $regex: labName, $options: 'i' };
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Query both collections
        const [ltTests, ltuTests] = await Promise.all([
            LabTest.find(queryLabTest).populate('farmerId', 'farmOwner farmName email').sort(sortOptions).lean(),
            LabTestUpload.find(queryLabTestUpload).sort(sortOptions).lean()
        ]);

        // Normalize and merge all tests
        const allTests = [
            ...ltTests.map(t => ({
                testReportNumber: t.testReportNumber,
                animalTagId: t.animalId,
                farmName: t.farmerId?.farmName || '',
                farmerEmail: t.farmerId?.email || '',
                drugOrSubstanceTested: t.drugName,
                residueLevelDetected: t.residueLevelDetected,
                mrlThreshold: t.mrlThreshold,
                unit: t.unit,
                isPassed: t.isPassed,
                labName: t.labName,
                testedBy: t.testedBy,
                testDate: t.testDate,
                status: t.status,
                notes: t.notes,
                source: 'Real Data'
            })),
            ...ltuTests.map(t => ({
                testReportNumber: t.testReportNumber,
                animalTagId: t.animalTagId,
                farmName: t.farmName || '',
                farmerEmail: t.farmerEmail || '',
                drugOrSubstanceTested: t.drugOrSubstanceTested,
                residueLevelDetected: t.residueLevelDetected,
                mrlThreshold: t.mrlThreshold,
                unit: t.unit,
                isPassed: t.isPassed,
                labName: t.labName,
                testedBy: t.labTechnicianName,
                testDate: t.testDate,
                status: t.status,
                notes: t.notes,
                source: 'Seed Data'
            }))
        ].sort((a, b) => new Date(b.testDate) - new Date(a.testDate));

        // Define CSV fields
        const fields = [
            { label: 'Test Report Number', value: 'testReportNumber' },
            { label: 'Animal Tag ID', value: 'animalTagId' },
            { label: 'Farm Name', value: 'farmName' },
            { label: 'Farmer Email', value: 'farmerEmail' },
            { label: 'Drug/Substance Tested', value: 'drugOrSubstanceTested' },
            { label: 'Residue Level Detected', value: 'residueLevelDetected' },
            { label: 'MRL Threshold', value: 'mrlThreshold' },
            { label: 'Unit', value: 'unit' },
            { label: 'Test Result', value: row => row.isPassed ? 'PASS' : 'FAIL' },
            { label: 'Lab Name', value: 'labName' },
            { label: 'Tested By', value: 'testedBy' },
            { label: 'Test Date', value: row => row.testDate ? new Date(row.testDate).toLocaleDateString() : '' },
            { label: 'Status', value: 'status' },
            { label: 'Notes', value: 'notes' },
            { label: 'Data Source', value: 'source' }
        ];

        // Convert to CSV
        const parser = new Parser({ fields });
        const csv = parser.parse(allTests);

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=mrl-analysis-${new Date().toISOString().split('T')[0]}.csv`);

        res.send(csv);

    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

