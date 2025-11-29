import express from 'express';
import { protect, protectAdmin } from '../middlewares/auth.middleware.js';
import {
    createTicket,
    getUserTickets,
    getTicketById,
    getAllTickets,
    getTicketStats,
    updateTicketStatus,
    respondToTicket,
    resolveTicket,
} from '../controllers/ticket.controller.js';

const router = express.Router();

// ========================================
// USER ROUTES (authenticated)
// ========================================

// Create new ticket
router.post('/', protect, createTicket);

// Get user's own tickets
router.get('/my-tickets', protect, getUserTickets);

// Get single ticket by ID (with authorization check in controller)
router.get('/:id', protect, getTicketById);

// ========================================
// ADMIN ROUTES
// ========================================

// Get all tickets (admin only)
router.get('/admin/all', protect, protectAdmin, getAllTickets);

// Get ticket statistics (admin only)
router.get('/admin/stats', protect, protectAdmin, getTicketStats);

// Update ticket status (admin only)
router.patch('/:id/status', protect, protectAdmin, updateTicketStatus);

// Respond to ticket (admin only)
router.post('/:id/respond', protect, protectAdmin, respondToTicket);

// Resolve ticket (admin only)
router.patch('/:id/resolve', protect, protectAdmin, resolveTicket);

export default router;
