// backend/controllers/admin.controller.js
import { runAmuAnalysis } from '../jobs/amuAnalysis.js';

export const triggerAmuAnalysis = async (req, res) => {
    try {
        console.log('Manual AMU analysis trigger received.');
        await runAmuAnalysis(); // Manually run the job
        res.status(200).json({ message: 'AMU analysis job completed successfully.' });
    } catch (error) {
        console.error("Manual AMU analysis trigger failed:", error);
        res.status(500).json({ message: 'Failed to run AMU analysis job.' });
    }
};