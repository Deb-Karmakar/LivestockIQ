import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '../../hooks/use-toast';
import { getAllTickets, getTicketStats, updateTicketStatus, respondToTicket, resolveTicket } from '../../services/ticketService';
import { Ticket, TrendingUp, CheckCircle2, Clock, AlertCircle, Loader2, Search, Filter, Send, X, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const SupportPage = () => {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Selected ticket for detail modal
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [responseText, setResponseText] = useState('');
    const [resolutionNote, setResolutionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [tickets, statusFilter, priorityFilter, roleFilter, searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, ticketsData] = await Promise.all([
                getTicketStats(),
                getAllTickets({ sortBy: 'createdAt', order: 'desc', limit: 100 }),
            ]);
            setStats(statsData);
            setTickets(ticketsData.tickets || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load support tickets.",
            });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...tickets];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(t => t.priority === priorityFilter);
        }
        if (roleFilter !== 'all') {
            filtered = filtered.filter(t => t.createdByRole === roleFilter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.ticketId.toLowerCase().includes(query) ||
                t.subject.toLowerCase().includes(query) ||
                t.createdByName.toLowerCase().includes(query)
            );
        }

        setFilteredTickets(filtered);
    };

    const handleViewDetails = (ticket) => {
        setSelectedTicket(ticket);
        setResponseText(ticket.adminResponse || '');
        setResolutionNote('');
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedTicket(null);
        setResponseText('');
        setResolutionNote('');
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedTicket) return;

        setSubmitting(true);
        try {
            await updateTicketStatus(selectedTicket._id, newStatus);
            toast({
                title: "Status Updated",
                description: `Ticket status changed to ${newStatus}`,
            });
            await fetchData();
            // Update selected ticket
            const updatedTicket = { ...selectedTicket, status: newStatus };
            setSelectedTicket(updatedTicket);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update ticket status.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendResponse = async () => {
        if (!selectedTicket || !responseText.trim()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please enter a response message.",
            });
            return;
        }

        setSubmitting(true);
        try {
            await respondToTicket(selectedTicket._id, responseText);
            toast({
                title: "Response Sent",
                description: "Your response has been sent to the user via email.",
            });
            await fetchData();
            handleCloseModal();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send response.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolveTicket = async () => {
        if (!selectedTicket) return;

        setSubmitting(true);
        try {
            await resolveTicket(selectedTicket._id, resolutionNote);
            toast({
                title: "Ticket Resolved",
                description: "Ticket has been marked as resolved and user has been notified.",
            });
            await fetchData();
            handleCloseModal();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to resolve ticket.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Open: 'bg-blue-100 text-blue-700 border-blue-200',
            'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Resolved: 'bg-green-100 text-green-700 border-green-200',
            Closed: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return colors[status] || colors.Open;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            Urgent: 'bg-red-100 text-red-700 border-red-200',
            High: 'bg-orange-100 text-orange-700 border-orange-200',
            Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Low: 'bg-green-100 text-green-700 border-green-200',
        };
        return colors[priority] || colors.Medium;
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            farmer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            vet: 'bg-purple-100 text-purple-700 border-purple-200',
            regulator: 'bg-blue-100 text-blue-700 border-blue-200',
        };
        return colors[role] || colors.farmer;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading support tickets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium mb-2">
                        <Ticket className="w-4 h-4" />
                        <span>Support Management</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
                    <p className="text-slate-400">
                        View and resolve user-submitted support requests
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <Ticket className="w-8 h-8 text-gray-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Open</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.byStatus.open}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.inProgress}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Resolved Today</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.resolvedToday}</p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <CardTitle className="text-base">Filters</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-xs mb-2">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Ticket ID, subject, user..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs mb-2">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Resolved">Resolved</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs mb-2">Priority</Label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="Urgent">Urgent</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs mb-2">User Role</Label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="farmer">Farmer</SelectItem>
                                    <SelectItem value="vet">Vet</SelectItem>
                                    <SelectItem value="regulator">Regulator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle>
                        All Tickets ({filteredTickets.length})
                    </CardTitle>
                    <CardDescription>
                        Click on a ticket to view details and respond
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredTickets.length === 0 ? (
                        <div className="text-center py-12">
                            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No tickets found matching your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ticket ID</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTickets.map((ticket) => (
                                        <TableRow key={ticket._id} className="hover:bg-gray-50 cursor-pointer">
                                            <TableCell className="font-mono text-sm">{ticket.ticketId}</TableCell>
                                            <TableCell className="max-w-xs truncate font-medium">{ticket.subject}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium">{ticket.createdByName}</span>
                                                    <Badge className={`${getRoleBadgeColor(ticket.createdByRole)} border text-xs w-fit`}>
                                                        {ticket.createdByRole}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getPriorityColor(ticket.priority)} border`}>
                                                    {ticket.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusColor(ticket.status)} border`}>
                                                    {ticket.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{ticket.category}</TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewDetails(ticket)}
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                    {selectedTicket.ticketId}
                                </Badge>
                                <span className="truncate">{selectedTicket.subject}</span>
                            </DialogTitle>
                            <DialogDescription>
                                Submitted by {selectedTicket.createdByName} ({selectedTicket.createdByRole}) on {format(new Date(selectedTicket.createdAt), 'MMM dd, yyyy')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Ticket Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">Status</Label>
                                    <Select value={selectedTicket.status} onValueChange={handleStatusChange} disabled={submitting}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Resolved">Resolved</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Priority</Label>
                                    <Badge className={`${getPriorityColor(selectedTicket.priority)} border mt-2 block w-fit`}>
                                        {selectedTicket.priority}
                                    </Badge>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Description</Label>
                                <div className="bg-gray-50 border rounded-lg p-4">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {selectedTicket.description}
                                    </p>
                                </div>
                            </div>

                            {/* Admin Response */}
                            <div>
                                <Label htmlFor="response" className="text-sm font-semibold mb-2 block">
                                    Admin Response
                                </Label>
                                <Textarea
                                    id="response"
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={6}
                                    className="resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This response will be sent to the user via email
                                </p>
                            </div>

                            {/* Resolution Note (if resolving) */}
                            {selectedTicket.status !== 'Resolved' && (
                                <div>
                                    <Label htmlFor="resolution" className="text-sm font-semibold mb-2 block">
                                        Resolution Note (Optional)
                                    </Label>
                                    <Textarea
                                        id="resolution"
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                        placeholder="Add a final resolution note when marking as resolved..."
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex gap-2 sm:gap-0">
                            <Button variant="outline" onClick={handleCloseModal} disabled={submitting}>
                                <X className="w-4 h-4 mr-2" />
                                Close
                            </Button>
                            <Button
                                onClick={handleSendResponse}
                                disabled={submitting || !responseText.trim()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Send Response
                            </Button>
                            {selectedTicket.status !== 'Resolved' && (
                                <Button
                                    onClick={handleResolveTicket}
                                    disabled={submitting}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                    )}
                                    Mark Resolved
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default SupportPage;