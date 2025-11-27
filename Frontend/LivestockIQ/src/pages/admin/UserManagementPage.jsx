import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Users, Search, Filter, RefreshCw, MoreVertical,
    Shield, UserCog, Stethoscope, Tractor, Building2,
    CheckCircle2, XCircle, Trash2, Ban
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
import { getAllUsers, updateUserStatus, deleteUser } from '../../services/userService';
import { useToast } from '../../hooks/use-toast';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const { toast } = useToast();

    const fetchUsers = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await getAllUsers();
            setUsers(data);

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
            toast({ title: "Success", description: `User ${newStatus === 'Active' ? 'activated' : 'suspended'}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    const handleDeleteUser = async (userId, role) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            await deleteUser(userId, role);
            setUsers(users.filter(u => u._id !== userId));
            toast({ title: "Success", description: "User deleted successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete user." });
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
            case 'Regulator': return <Building2 className="w-4 h-4 text-amber-600" />;
            case 'Admin': return <Shield className="w-4 h-4 text-purple-600" />;
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
                    <div className="w-16 h-16 border-4 border-purple-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading users...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                            <Users className="w-4 h-4" />
                            <span>User Administration</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            User Management
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Manage access and permissions for all platform users.
                            Currently showing <span className="text-white font-semibold">{filteredUsers.length} users</span>.
                        </p>
                    </div>


                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <Filter className="w-5 h-5 text-purple-600" />
                            </div>
                            <CardTitle>Filter Users</CardTitle>
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
                                    <SelectItem value="Regulator">Regulator</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
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
                                                        {user.status === 'Active' ? (
                                                            <DropdownMenuItem
                                                                className="text-red-600 cursor-pointer"
                                                                onClick={() => handleStatusUpdate(user._id, user.role, 'Suspended')}
                                                            >
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                Suspend User
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                className="text-emerald-600 cursor-pointer"
                                                                onClick={() => handleStatusUpdate(user._id, user.role, 'Active')}
                                                            >
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Activate User
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 cursor-pointer"
                                                            onClick={() => handleDeleteUser(user._id, user.role)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete User
                                                        </DropdownMenuItem>
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
                                            <p className="text-gray-900 font-medium">No users found</p>
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

export default UserManagementPage;