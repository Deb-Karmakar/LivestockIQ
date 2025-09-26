import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import vetRoutes from './routes/vet.routes.js';
import animalRoutes from './routes/animal.routes.js';
import treatmentRoutes from './routes/treatment.routes.js'; 
import prescriptionRoutes from './routes/prescription.routes.js';
import farmerRoutes from './routes/farmer.routes.js';
import saleRoutes from './routes/sales.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import reportRoutes from './routes/reports.routes.js';
import regulatorRoutes from './routes/regulator.routes.js';
import seedAdminUser from './config/seed.js';
import adminRoutes from './routes/admin.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { startAmuAnalysisJob } from './jobs/amuAnalysis.js';
import { startDiseasePredictionJob } from './jobs/diseaseAlertJob.js';

connectDB().then(() => {
    seedAdminUser(); // 2. Call the seed function after the DB connects
});
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/vets', vetRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/inventory', inventoryRoutes); 
app.use('/api/reports', reportRoutes);
app.use('/api/regulator', regulatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startAmuAnalysisJob();
    startDiseasePredictionJob();
});