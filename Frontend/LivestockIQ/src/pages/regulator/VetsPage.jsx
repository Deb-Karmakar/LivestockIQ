// Frontend/LivestockIQ/src/pages/regulator/VetsPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, GraduationCap, Building2, FileText, Sparkles, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAllVets } from '@/services/vetManagementService';

// Animated counter
const AnimatedCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const end = parseInt(value) || 0;
        if (end === 0) return;
        const increment = end / (duration / 16);
        let current = 0;
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

const VetsPage = () => {
    const [vets, setVets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, active: 0, totalPrescriptions: 0 });
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchVets();
    }, []);

    const fetchVets = async () => {
        try {
            setLoading(true);
            const response = await getAllVets({ page: 1, limit: 100 });
            setVets(response.data);

            const totalPrescriptions = response.data.reduce((sum, vet) => sum + (vet.statistics?.totalPrescriptions || 0), 0);
            const active = response.data.filter(v => v.status === 'Active').length;

            setStats({
                total: response.pagination.totalItems,
                active,
                totalPrescriptions
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load veterinarians' });
        } finally {
            setLoading(false);
        }
    };

    const filteredVets = vets.filter(vet =>
        vet.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vet.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vet.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vet.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <p className="text-gray-500 font-medium">Loading veterinarians...</p>
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
                        <span>Veterinarian Management</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold mb-2">Veterinarian Directory</h1>
                    <p className="text-slate-400 max-w-2xl">Monitor and inspect all registered veterinarians in the system</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Vets</p>
                                <p className="text-3xl font-bold text-blue-600"><AnimatedCounter value={stats.total} /></p>
                            </div>
                            <Stethoscope className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Vets</p>
                                <p className="text-3xl font-bold text-green-600"><AnimatedCounter value={stats.active} /></p>
                            </div>
                            <Stethoscope className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Prescriptions</p>
                                <p className="text-3xl font-bold text-purple-600"><AnimatedCounter value={stats.totalPrescriptions} /></p>
                            </div>
                            <FileText className="w-12 h-12 text-purple-500 opacity-20" />
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
                            placeholder="Search vets by name, license, email, or specialization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Vets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVets.map((vet) => (
                    <Card key={vet._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(`/regulator/vets/${vet._id}`)}>
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Stethoscope className="w-5 h-5 text-blue-600" />
                                        {vet.fullName}
                                    </CardTitle>
                                    <p className="text-sm text-gray-600 mt-1">License: {vet.licenseNumber}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {vet.specialization && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <GraduationCap className="w-4 h-4" />
                                    <span>{vet.specialization}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-xs text-gray-500">Farms</p>
                                    <p className="text-lg font-semibold text-gray-900">{vet.statistics?.farmsSupervised || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Prescriptions</p>
                                    <p className="text-lg font-semibold text-gray-900">{vet.statistics?.totalPrescriptions || 0}</p>
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Compliance</span>
                                    {getComplianceBadge(vet.statistics?.complianceRate || 100)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredVets.length === 0 && (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-12 text-center">
                        <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No veterinarians found matching your search</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default VetsPage;
