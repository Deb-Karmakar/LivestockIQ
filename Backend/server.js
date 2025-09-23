import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import vetRoutes from './routes/vet.routes.js';
import animalRoutes from './routes/animal.routes.js';
import treatmentRoutes from './routes/treatment.routes.js'; 
import prescriptionRoutes from './routes/prescription.routes.js';
import farmerRoutes from './routes/farmer.routes.js';
import saleRoutes from './routes/sales.routes.js';


dotenv.config();
connectDB();
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});