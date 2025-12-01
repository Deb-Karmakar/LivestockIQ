// Frontend/LivestockIQ/src/pages/regulator/FarmsPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, MapPin, Users, Activity, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAllFarms } from '@/services/farmManagementService';

// Animated counter component
const AnimatedCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const start = 0;
        const end = parseInt(value) || 0;
        if (end === 0) return;

        const increment = end / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{count.toLocaleString('en-IN')}</span>;
};

const FarmsPage = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, active: 0, totalAnimals: 0 });
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchFarms();
    }, []);

    const fetchFarms = async () => {
        try {
            setLoading(true);
            const response = await getAllFarms({ page: 1, limit: 100 });
            setFarms(response.data);

            // Calculate stats
            const totalAnimals = response.data.reduce((sum, farm) => sum + (farm.statistics?.totalAnimals || 0), 0);
            const active = response.data.filter(f => f.status === 'Active').length;

            setStats({
                total: response.pagination.totalItems,
                active,
                totalAnimals
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load farms'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredFarms = farms.filter(farm =>
        farm.farmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farm.farmOwner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farm.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getComplianceBadge = (rate) => {
        if (rate >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
        if (rate >= 70) return <Badge className="bg-yellow-500">Good</Badge>;
        return <Badge variant="destructive">Needs Attention</Badge>;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading farms...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative">
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Farm Management</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold mb-2">Farm Directory</h1>
                    <p className="text-slate-400 max-w-2xl">Monitor and inspect all registered farms in the system</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Farms</p>
                                <p className="text-3xl font-bold text-blue-600"><AnimatedCounter value={stats.total} /></p>
                            </div>
                            <Building2 className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Farms</p>
                                <p className="text-3xl font-bold text-green-600"><AnimatedCounter value={stats.active} /></p>
                            </div>
                            <Activity className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Animals</p>
                                <p className="text-3xl font-bold text-purple-600"><AnimatedCounter value={stats.totalAnimals} /></p>
                            </div>
                            <Users className="w-12 h-12 text-purple-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Search farms by name, owner, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Farms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFarms.map((farm) => (
                    <Card key={farm._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(`/regulator/farms/${farm._id}`)}>
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                        {farm.farmName}
                                    </CardTitle>
                                    <p className="text-sm text-gray-600 mt-1">{farm.farmOwner}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{farm.speciesReared || 'Mixed'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-xs text-gray-500">Animals</p>
                                    <p className="text-lg font-semibold text-gray-900">{farm.statistics?.totalAnimals || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Active Treatments</p>
                                    <p className="text-lg font-semibold text-gray-900">{farm.statistics?.activeTreatments || 0}</p>
                                </div>
                            </div>

                            {farm.statistics?.activeAlerts > 0 && (
                                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm text-red-700">{farm.statistics.activeAlerts} Active Alert{farm.statistics.activeAlerts !== 1 ? 's' : ''}</span>
                                </div>
                            )}

                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Compliance</span>
                                    {getComplianceBadge(farm.statistics?.complianceRate || 100)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredFarms.length === 0 && (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-12 text-center">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No farms found matching your search</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FarmsPage;
