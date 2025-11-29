import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '../../contexts/AuthContext';
import { getUserTickets } from '../../services/ticketService';
import { useToast } from '../../hooks/use-toast';
import { Ticket, Loader2, Calendar, AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

const TicketHistoryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState([]);
    const [filter, setFilter] = useState('all');
    const [expandedTicket, setExpandedTicket] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const filters = filter !== 'all' ? { status: filter } : {};
            const response = await getUserTickets(filters);
            setTickets(response.tickets || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load tickets. Please try again.",
            });
        } finally {
            setLoading(false);
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

    const getStatusIcon = (status) => {
        const icons = {
            Open: <AlertCircle className="w-4 h-4" />,
            'In Progress': <Clock className="w-4 h-4" />,
            Resolved: <CheckCircle2 className="w-4 h-4" />,
            Closed: <CheckCircle2 className="w-4 h-4" />,
        };
        return icons[status] || icons.Open;
    };

    const getRoleBasedPath = () => {
        const role = user?.role?.toLowerCase();
        // Map 'veterinarian' to 'vet' for URL routing
        const urlRole = role === 'veterinarian' ? 'vet' : role;
        return `/${urlRole}/support/raise-ticket`;
    };

    const toggleExpand = (ticketId) => {
        setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading your tickets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                            <Ticket className="w-4 h-4" />
                            <span>Support Tickets</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
                        <p className="text-slate-400">
                            View and track all your support requests
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate(getRoleBasedPath())}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        New Ticket
                    </Button>
                </div>
            </div>

            {/* Filter and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
                        <p className="text-2xl font-bold">{tickets.length}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Open</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {tickets.filter(t => t.status === 'Open').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500 mb-1">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {tickets.filter(t => t.status === 'In Progress').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500 mb-1">Resolved</p>
                        <p className="text-2xl font-bold text-green-600">
                            {tickets.filter(t => t.status === 'Resolved').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tickets</SelectItem>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets List */}
            {tickets.length === 0 ? (
                <Card className="border-0 shadow-lg">
                    <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ticket className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Found</h3>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all'
                                ? "You haven't created any support tickets yet."
                                : `You don't have any ${filter} tickets.`}
                        </p>
                        <Button onClick={() => navigate(getRoleBasedPath())}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Create Your First Ticket
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <Card key={ticket._id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {ticket.ticketId}
                                            </Badge>
                                            <Badge className={`${getStatusColor(ticket.status)} border`}>
                                                {getStatusIcon(ticket.status)}
                                                <span className="ml-1">{ticket.status}</span>
                                            </Badge>
                                            <Badge className={`${getPriorityColor(ticket.priority)} border`}>
                                                {ticket.priority}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg mb-1 line-clamp-1">
                                            {ticket.subject}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-4 text-xs flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                                            </span>
                                            <span>Category: {ticket.category}</span>
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpand(ticket._id)}
                                    >
                                        {expandedTicket === ticket._id ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>

                            {expandedTicket === ticket._id && (
                                <CardContent className="pt-0 border-t">
                                    <div className="space-y-4 mt-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Description:</h4>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                                                {ticket.description}
                                            </p>
                                        </div>

                                        {ticket.adminResponse && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Admin Response:
                                                </h4>
                                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                        {ticket.adminResponse}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                                            <span>Last Updated: {format(new Date(ticket.updatedAt), 'MMM dd, yyyy, hh:mm a')}</span>
                                            {ticket.resolvedAt && (
                                                <span>Resolved: {format(new Date(ticket.resolvedAt), 'MMM dd, yyyy')}</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TicketHistoryPage;
