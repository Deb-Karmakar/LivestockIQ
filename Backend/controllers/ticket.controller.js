import Ticket from '../models/ticket.model.js';
import Farmer from '../models/farmer.model.js';
import Vet from '../models/vet.model.js';
import Regulator from '../models/regulator.model.js';
import sendEmail from '../utils/sendEmail.js';

// ========================================
// USER ENDPOINTS
// ========================================

/**
 * Create a new support ticket
 * POST /api/tickets
 */
export const createTicket = async (req, res) => {
    try {
        const { subject, description, category, priority } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Validate required fields
        if (!subject || !description || !category) {
            return res.status(400).json({ message: 'Subject, description, and category are required' });
        }

        // Get user details based on role
        let user;
        let modelName;

        if (userRole === 'farmer') {
            user = await Farmer.findById(userId);
            modelName = 'Farmer';
        } else if (userRole === 'veterinarian' || userRole === 'vet') {
            user = await Vet.findById(userId);
            modelName = 'Vet';
        } else if (userRole === 'regulator') {
            user = await Regulator.findById(userId);
            modelName = 'Regulator';
        } else {
            return res.status(400).json({ message: 'Invalid user role' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create ticket
        const ticket = new Ticket({
            subject,
            description,
            category,
            priority: priority || 'Medium',
            createdBy: userId,
            createdByModel: modelName,
            createdByRole: userRole,
            createdByName: user.fullName || user.farmOwner || user.name,  // Vets/Regulators use fullName, Farmers use farmOwner
            createdByEmail: user.email,
            status: 'Open',
            statusHistory: [
                {
                    status: 'Open',
                    changedAt: new Date(),
                    note: 'Ticket created',
                },
            ],
        });


        await ticket.save();

        // Send confirmation email to user
        await sendEmail({
            to: user.email,
            subject: `Support Ticket Created - ${ticket.ticketId}`,
            template: 'ticketConfirmation',
            templateData: {
                userName: user.name,
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                category: ticket.category,
                priority: ticket.priority,
                description: ticket.description,
            },
        });

        // Emit WebSocket event for real-time admin notification
        if (req.app.get('io')) {
            req.app.get('io').emit('new-ticket', {
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                createdByName: ticket.createdByName,
                createdByRole: ticket.createdByRole,
                priority: ticket.priority,
                category: ticket.category,
            });
        }

        res.status(201).json({
            message: 'Support ticket created successfully',
            ticket: {
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                description: ticket.description,
                category: ticket.category,
                priority: ticket.priority,
                status: ticket.status,
                createdAt: ticket.createdAt,
            },
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server error while creating ticket', error: error.message });
    }
};

/**
 * Get user's own tickets
 * GET /api/tickets/my-tickets
 */
export const getUserTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority, category, sortBy = 'createdAt', order = 'desc' } = req.query;

        // Build filter
        const filter = { createdBy: userId };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        // Build sort
        const sortOrder = order === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortOrder };

        const tickets = await Ticket.find(filter).sort(sort);

        res.json({
            tickets,
            count: tickets.length,
        });
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Server error while fetching tickets', error: error.message });
    }
};

/**
 * Get single ticket by ID (with authorization check)
 * GET /api/tickets/:id
 */
export const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const ticket = await Ticket.findById(id)
            .populate('resolvedBy', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Authorization: Users can only view their own tickets, admins can view all
        if (userRole !== 'admin' && ticket.createdBy.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this ticket' });
        }

        res.json({ ticket });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ message: 'Server error while fetching ticket', error: error.message });
    }
};

// ========================================
// ADMIN ENDPOINTS
// ========================================

/**
 * Get all tickets (Admin only) with filtering
 * GET /api/tickets/admin/all
 */
export const getAllTickets = async (req, res) => {
    try {
        const {
            status,
            priority,
            category,
            role,
            search,
            startDate,
            endDate,
            sortBy = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 50,
        } = req.query;

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        if (role) filter.createdByRole = role;

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Search filter (ticket ID or subject)
        if (search) {
            filter.$or = [
                { ticketId: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
            ];
        }

        // Build sort
        const sortOrder = order === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortOrder };

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const tickets = await Ticket.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('resolvedBy', 'name email');

        const totalCount = await Ticket.countDocuments(filter);

        res.json({
            tickets,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                hasMore: skip + tickets.length < totalCount,
            },
        });
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        res.status(500).json({ message: 'Server error while fetching tickets', error: error.message });
    }
};

/**
 * Get ticket statistics (Admin only)
 * GET /api/tickets/admin/stats
 */
export const getTicketStats = async (req, res) => {
    try {
        const totalTickets = await Ticket.countDocuments();
        const openTickets = await Ticket.countDocuments({ status: 'Open' });
        const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
        const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
        const closedTickets = await Ticket.countDocuments({ status: 'Closed' });

        // Tickets resolved today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const resolvedToday = await Ticket.countDocuments({
            status: 'Resolved',
            resolvedAt: { $gte: todayStart },
        });

        // Priority breakdown
        const urgentTickets = await Ticket.countDocuments({ priority: 'Urgent', status: { $nin: ['Resolved', 'Closed'] } });
        const highTickets = await Ticket.countDocuments({ priority: 'High', status: { $nin: ['Resolved', 'Closed'] } });
        const mediumTickets = await Ticket.countDocuments({ priority: 'Medium', status: { $nin: ['Resolved', 'Closed'] } });
        const lowTickets = await Ticket.countDocuments({ priority: 'Low', status: { $nin: ['Resolved', 'Closed'] } });

        // Category breakdown
        const categoryStats = await Ticket.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Role breakdown
        const roleStats = await Ticket.aggregate([
            { $group: { _id: '$createdByRole', count: { $sum: 1 } } },
        ]);

        // Average resolution time (in hours)
        const resolvedTicketsWithTime = await Ticket.find({
            status: 'Resolved',
            resolvedAt: { $exists: true },
        });

        let avgResolutionTime = 0;
        if (resolvedTicketsWithTime.length > 0) {
            const totalTime = resolvedTicketsWithTime.reduce((sum, ticket) => {
                const diff = ticket.resolvedAt - ticket.createdAt;
                return sum + diff;
            }, 0);
            avgResolutionTime = (totalTime / resolvedTicketsWithTime.length / (1000 * 60 * 60)).toFixed(1); // Convert to hours
        }

        res.json({
            total: totalTickets,
            byStatus: {
                open: openTickets,
                inProgress: inProgressTickets,
                resolved: resolvedTickets,
                closed: closedTickets,
            },
            resolvedToday,
            byPriority: {
                urgent: urgentTickets,
                high: highTickets,
                medium: mediumTickets,
                low: lowTickets,
            },
            byCategory: categoryStats,
            byRole: roleStats,
            avgResolutionTimeHours: parseFloat(avgResolutionTime),
        });
    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        res.status(500).json({ message: 'Server error while fetching stats', error: error.message });
    }
};

/**
 * Update ticket status (Admin only)
 * PATCH /api/tickets/:id/status
 */
export const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;
        const adminId = req.user.id;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const oldStatus = ticket.status;
        ticket.status = status;

        // Add to status history
        ticket.statusHistory.push({
            status,
            changedBy: adminId,
            changedAt: new Date(),
            note: note || `Status changed from ${oldStatus} to ${status}`,
        });


        await ticket.save();

        // Notify user via WebSocket if available
        if (req.app.get('io')) {
            req.app.get('io').emit('ticket-update', {
                ticketId: ticket.ticketId,
                userId: ticket.createdBy,
                status: ticket.status,
            });
        }

        res.json({
            message: 'Ticket status updated successfully',
            ticket,
        });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({ message: 'Server error while updating status', error: error.message });
    }
};

/**
 * Respond to ticket (Admin only)
 * POST /api/tickets/:id/respond
 */
export const respondToTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        const adminId = req.user.id;

        if (!response) {
            return res.status(400).json({ message: 'Response is required' });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Update ticket with admin response
        ticket.adminResponse = response;

        // Update status to In Progress if it's Open
        if (ticket.status === 'Open') {
            ticket.status = 'In Progress';
            ticket.statusHistory.push({
                status: 'In Progress',
                changedBy: adminId,
                changedAt: new Date(),
                note: 'Admin responded to ticket',
            });
        }

        await ticket.save();

        // Send email to user
        await sendEmail({
            to: ticket.createdByEmail,
            subject: `Response to Your Support Ticket - ${ticket.ticketId}`,
            template: 'ticketResponse',
            templateData: {
                userName: ticket.createdByName,
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                adminResponse: response,
                status: ticket.status,
            },
        });

        // Notify user via WebSocket
        if (req.app.get('io')) {
            req.app.get('io').emit('ticket-response', {
                ticketId: ticket.ticketId,
                userId: ticket.createdBy,
            });
        }

        res.json({
            message: 'Response sent successfully',
            ticket,
        });
    } catch (error) {
        console.error('Error responding to ticket:', error);
        res.status(500).json({ message: 'Server error while responding to ticket', error: error.message });
    }
};

/**
 * Resolve ticket (Admin only)
 * PATCH /api/tickets/:id/resolve
 */
export const resolveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolutionNote } = req.body;
        const adminId = req.user.id;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.status = 'Resolved';
        ticket.resolvedBy = adminId;
        ticket.resolvedAt = new Date();

        ticket.statusHistory.push({
            status: 'Resolved',
            changedBy: adminId,
            changedAt: new Date(),
            note: resolutionNote || 'Ticket resolved',
        });

        await ticket.save();

        // Send resolution confirmation email
        await sendEmail({
            to: ticket.createdByEmail,
            subject: `Support Ticket Resolved - ${ticket.ticketId}`,
            template: 'ticketResolved',
            templateData: {
                userName: ticket.createdByName,
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                resolutionNote: resolutionNote || 'Your issue has been resolved.',
                adminResponse: ticket.adminResponse,
            },
        });

        // Notify user via WebSocket
        if (req.app.get('io')) {
            req.app.get('io').emit('ticket-resolved', {
                ticketId: ticket.ticketId,
                userId: ticket.createdBy,
            });
        }

        res.json({
            message: 'Ticket resolved successfully',
            ticket,
        });
    } catch (error) {
        console.error('Error resolving ticket:', error);
        res.status(500).json({ message: 'Server error while resolving ticket', error: error.message });
    }
};
