import express from 'express';
import { createServer } from 'http';
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
import groqRoutes from './routes/groq.routes.js';
import auditRoutes from './routes/audit.routes.js';
import auditEnhancementRoutes from './routes/auditEnhancements.routes.js';
import mrlRoutes from './routes/mrl.routes.js';
import emailRoutes from './routes/email.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import regulatorAlertsRoutes from './routes/regulatorAlerts.routes.js';
import feedRoutes from './routes/feed.routes.js';
import feedAdministrationRoutes from './routes/feedAdministration.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import { startAmuAnalysisJob } from './jobs/amuAnalysis.js';
import { startDiseasePredictionJob } from './jobs/diseaseAlertJob.js';
import { startBlockchainAnchorJob } from './jobs/blockchainAnchor.js';
import { startWithdrawalAlertJob } from './jobs/withdrawalAlerts.js';
import { startWeeklySummaryJob } from './jobs/weeklySummary.js';
import { startMRLTestReminderJob } from './jobs/mrlTestReminders.js';
import { startWithdrawalStatusUpdater } from './jobs/withdrawalStatusUpdater.job.js';
import { initializeSocketIO } from './config/socket.js';
import { initializeWebSocket } from './services/websocket.service.js';

// ✅ Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

// Connect DB + seed admin user
connectDB().then(() => {
  seedAdminUser();
});

const app = express();

// ✅ Allow CORS (allow all origins for mobile app development)
app.use(
  cors({
    origin: true, // Allow all origins (mobile app + web frontend)
    credentials: true,
  })
);

app.use(express.json());

// Root route
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
app.use('/api/groq', groqRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/audit', auditEnhancementRoutes); // Enhancement routes
app.use('/api/mrl', mrlRoutes); // MRL compliance routes
app.use('/api/email', emailRoutes); // Email notification testing routes
app.use('/api/jobs', jobsRoutes); // Scheduled job management routes
app.use('/api/regulator', regulatorAlertsRoutes); // Regulator alert system routes
app.use('/api/feed', feedRoutes); // Feed inventory management routes
app.use('/api/feed-admin', feedAdministrationRoutes); // Feed administration tracking routes
app.use('/api/tickets', ticketRoutes); // Support ticket system routes

// Debugging route
import Farmer from './models/farmer.model.js'; // ✅ Ensure Farmer is imported
app.get('/debug/farmers', async (req, res) => {
  try {
    const uniqueLocations = await Farmer.distinct('location', {
      'location.latitude': { $exists: true, $ne: null },
      'location.longitude': { $exists: true, $ne: null },
    });

    console.log('Unique locations:', uniqueLocations);
    res.json({
      count: uniqueLocations.length,
      locations: uniqueLocations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocketIO(httpServer);
initializeWebSocket(io);  // Pass io instance to websocket service

// Start server
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);

  // Start existing jobs
  startAmuAnalysisJob();
  startDiseasePredictionJob();
  startBlockchainAnchorJob();

  // Start MRL & Alert jobs (Phase 3)
  startWithdrawalAlertJob();
  startWeeklySummaryJob();
  startMRLTestReminderJob();
  startWithdrawalStatusUpdater(); // Feed withdrawal tracking

  console.log('\n📅 All scheduled jobs initialized');
});
