// backend/controllers/admin.controller.js
import { runHistoricalSpikeAnalysis, runPeerComparisonAnalysis, runAllAmuAnalysis } from '../jobs/amuAnalysis.js';
import { runDiseasePrediction } from '../jobs/diseaseAlertJob.js';
import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Regulator from '../models/regulator.model.js';
import Admin from '../models/admin.model.js';
import Animal from '../models/animal.model.js';
import AuditLog from '../models/auditLog.model.js';

export const triggerAmuAnalysis = async (req, res) => {
    try {
        console.log('Manual AMU analysis trigger received.');
        await runHistoricalSpikeAnalysis(); // Run historical spike analysis
        res.status(200).json({ message: 'AMU analysis job completed successfully.' });
    } catch (error) {
        console.error("Manual AMU analysis trigger failed:", error);
        res.status(500).json({ message: 'Failed to run AMU analysis job.' });
    }
};

export const triggerPeerAnalysis = async (req, res) => {
    try {
        console.log('Manual AMU analysis (peer comparison) trigger received.');
        await runPeerComparisonAnalysis();
        res.status(200).json({ message: 'Peer comparison analysis job completed successfully.' });
    } catch (error) {
        console.error("Manual peer comparison trigger failed:", error);
        res.status(500).json({ message: 'Failed to run peer comparison analysis job.' });
    }
};

export const triggerDiseasePrediction = async (req, res) => {
    try {
        console.log('Manual disease prediction trigger received.');
        await runDiseasePrediction();
        res.status(200).json({ message: 'Disease prediction job completed successfully.' });
    } catch (error) {
        console.error("Manual disease prediction trigger failed:", error);
        res.status(500).json({ message: 'Failed to run disease prediction job.' });
    }
};

// --- User Management ---

export const getAllUsers = async (req, res) => {
    try {
        const [farmers, vets, regulators, admins] = await Promise.all([
            Farmer.find({}).select('-password').lean(),
            Veterinarian.find({}).select('-password').lean(),
            Regulator.find({}).select('-password').lean(),
            Admin.find({}).select('-password').lean(),
        ]);

        const normalize = (users, role) => users.map(u => ({
            _id: u._id,
            name: u.fullName || u.farmOwner || u.agencyName, // Handle different name fields
            email: u.email,
            role: u.role || role, // Admin has role field, others don't
            status: u.status || 'Active',
            createdAt: u.createdAt
        }));

        const allUsers = [
            ...normalize(farmers, 'Farmer'),
            ...normalize(vets, 'Veterinarian'),
            ...normalize(regulators, 'Regulator'),
            ...normalize(admins, 'Admin')
        ];

        // Sort by newest first
        allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(allUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

export const updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status, role } = req.body;

    try {
        let Model;
        switch (role) {
            case 'Farmer': Model = Farmer; break;
            case 'Veterinarian': Model = Veterinarian; break;
            case 'Regulator': Model = Regulator; break;
            case 'Admin': Model = Admin; break;
            default: return res.status(400).json({ message: "Invalid user role" });
        }

        const user = await Model.findByIdAndUpdate(id, { status }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User status updated", user });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Failed to update user status" });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const { role } = req.query; // Pass role as query param for deletion

    try {
        let Model;
        switch (role) {
            case 'Farmer': Model = Farmer; break;
            case 'Veterinarian': Model = Veterinarian; break;
            case 'Regulator': Model = Regulator; break;
            case 'Admin': Model = Admin; break;
            default: return res.status(400).json({ message: "Invalid user role" });
        }

        const user = await Model.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};

// --- Dashboard Stats ---

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Fetch Counts
        const [
            farmerCount,
            vetCount,
            regulatorCount,
            adminCount,
            animalCount,
            activeFarmsCount
        ] = await Promise.all([
            Farmer.countDocuments({}),
            Veterinarian.countDocuments({}),
            Regulator.countDocuments({}),
            Admin.countDocuments({}),
            Animal.countDocuments({}),
            Farmer.countDocuments({ status: 'Active' })
        ]);

        // 2. Fetch Recent Activity (Last 5 Audit Logs)
        const recentLogs = await AuditLog.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('performedBy', 'fullName farmOwner agencyName email') // Populate name fields
            .lean();

        const formattedLogs = recentLogs.map(log => {
            let performerName = 'Unknown';
            if (log.performedBy) {
                performerName = log.performedBy.fullName || log.performedBy.farmOwner || log.performedBy.agencyName || log.performedBy.email;
            } else if (log.performedByRole === 'System') {
                performerName = 'System';
            }

            return {
                id: log._id,
                title: log.eventType,
                description: `${log.entityType} ${log.eventType.toLowerCase()}d by ${performerName}`,
                type: log.performedByRole === 'System' ? 'System' : 'User',
                time: new Date(log.createdAt).toLocaleString()
            };
        });

        // 3. Fetch System Activity (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activityStats = await AuditLog.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days with 0
        const systemActivity = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const found = activityStats.find(s => s._id === dateStr);
            systemActivity.push({
                name: dayName,
                calls: found ? found.count : 0
            });
        }

        res.status(200).json({
            stats: {
                totalUsers: farmerCount + vetCount + regulatorCount + adminCount,
                activeFarms: activeFarmsCount,
                totalAnimals: animalCount,
                pendingApprovals: 0 // Placeholder
            },
            userDistribution: [
                { name: 'Farmers', value: farmerCount, color: '#10b981' },
                { name: 'Veterinarians', value: vetCount, color: '#3b82f6' },
                { name: 'Regulators', value: regulatorCount, color: '#8b5cf6' },
                { name: 'Admins', value: adminCount, color: '#64748b' },
            ],
            systemActivity,
            recentActivities: formattedLogs
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};