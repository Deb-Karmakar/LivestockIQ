import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Users, Search, Filter, RefreshCw, MoreVertical,
    Shield, UserCog, Stethoscope, Tractor, Building2,
    CheckCircle2, XCircle, Ban, Eye
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { getAllUsers, updateUserStatus } from '../../services/userService';
import { useToast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const UserOversightPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchUsers = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await getAllUsers();
            // Filter to show only Farmers and Veterinarians for Regulators
            const relevantUsers = data.filter(u => u.role === 'Farmer' || u.role === 'Veterinarian');
            setUsers(relevantUsers);

            if (isRefresh) {
                toast({ title: "Refreshed", description: "User list updated." });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load users."
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusUpdate = async (userId, role, newStatus) => {
        try {
            await updateUserStatus(userId, role, newStatus);
            setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
            toast({ title: "Success", description: `License ${newStatus === 'Active' ? 'activated' : 'suspended'}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    const handleViewDetails = (user) => {
        if (user.role === 'Farmer') {
            // We need to find the farm ID associated with this user. 
            // Ideally, the user object should have it, or we navigate to a user profile.
            // For now, let's assume we can navigate to the farms page or search there.
            // Or better, if the API returns farm details populated.
            // If not available, we might need to fetch it.
            // For this implementation, let's just show a toast if we can't deep link immediately,
            // or navigate to the directory.
            navigate('/regulator/farms');
            toast({ title: "Navigation", description: `Please search for ${user.name} in the Farm Directory.` });
        } else if (user.role === 'Veterinarian') {
            navigate('/regulator/vets');
            toast({ title: "Navigation", description: `Please search for ${user.name} in the Vet Directory.` });
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = searchTerm === "" ||
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            const matchesStatus = statusFilter === "all" || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Farmer': return <Tractor className="w-4 h-4 text-emerald-600" />;
            case 'Veterinarian': return <Stethoscope className="w-4 h-4 text-blue-600" />;
            default: return <UserCog className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        return status === 'Active'
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
            : 'bg-red-100 text-red-700 border-red-200';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading licensees...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <Users className="w-4 h-4" />
                            <span>License Management</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            User Oversight
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Manage licenses and permissions for Farmers and Veterinarians.
                            Currently overseeing <span className="text-white font-semibold">{filteredUsers.length} licensees</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Filter className="w-5 h-5 text-blue-600" />
                            </div>
                            <CardTitle>Filter Licensees</CardTitle>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="Farmer">Farmer</SelectItem>
                                    <SelectItem value="Veterinarian">Veterinarian</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50/50">
                                    <th className="text-left p-4 font-semibold text-gray-600">User</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Role</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                                    <th className="text-left p-4 font-semibold text-gray-600">Joined</th>
                                    <th className="text-right p-4 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user._id} className="border-b hover:bg-gray-50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {getRoleIcon(user.role)}
                                                    <span className="text-sm font-medium text-gray-700">{user.role}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={getStatusColor(user.status)}>
                                                    {user.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-gray-600">
                                                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => handleViewDetails(user)}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {user.status === 'Active' ? (
                                                            <DropdownMenuItem
                                                                className="text-red-600 cursor-pointer"
                                                                onClick={() => handleStatusUpdate(user._id, user.role, 'Suspended')}
                                                            >
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                Suspend
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                className="text-emerald-600 cursor-pointer"
                                                                onClick={() => handleStatusUpdate(user._id, user.role, 'Active')}
                                                            >
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Activate License
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-900 font-medium">No licensees found</p>
                                            <p className="text-gray-500 text-sm mt-1">
                                                Try adjusting your search or filters
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserOversightPage;
