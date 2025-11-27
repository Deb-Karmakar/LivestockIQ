// frontend/src/pages/vet/VetReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, FileDown, Tractor, ClipboardCheck, Sparkles, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { axiosInstance } from '../../contexts/AuthContext';
import { generateFarmAmuReportForVet, generateVetSignedLog } from '../../services/reportsService';

const VetReportsPage = () => {
    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState('');
    const [farmReportDateRange, setFarmReportDateRange] = useState(undefined);
    const [vetLogDateRange, setVetLogDateRange] = useState(undefined);
    const [isGeneratingFarmReport, setIsGeneratingFarmReport] = useState(false);
    const [isGeneratingVetLog, setIsGeneratingVetLog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const { data } = await axiosInstance.get('/vets/my-farmers');
                setFarms(data || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load your supervised farms.' });
            }
        };
        fetchFarms();
    }, [toast]);

    const handleDownload = (data, reportType) => {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleGenerateFarmReport = async () => {
        if (!selectedFarm || !farmReportDateRange?.from || !farmReportDateRange?.to) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a farm and a valid date range.' });
            return;
        }
        setIsGeneratingFarmReport(true);
        try {
            const data = await generateFarmAmuReportForVet({
                farmerId: selectedFarm,
                from: farmReportDateRange.from.toISOString(),
                to: farmReportDateRange.to.toISOString(),
            });
            handleDownload(data, 'Farm_AMU');
            toast({ title: "Success", description: "Farm report downloaded successfully." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate farm report.' });
        } finally {
            setIsGeneratingFarmReport(false);
        }
    };

    const handleGenerateVetLog = async () => {
        if (!vetLogDateRange?.from || !vetLogDateRange?.to) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a valid date range.' });
            return;
        }
        setIsGeneratingVetLog(true);
        try {
            const data = await generateVetSignedLog({
                from: vetLogDateRange.from.toISOString(),
                to: vetLogDateRange.to.toISOString(),
            });
            handleDownload(data, 'Vet_Signed_Log');
            toast({ title: "Success", description: "Vet log downloaded successfully." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate your signed log.' });
        } finally {
            setIsGeneratingVetLog(false);
        }
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Compliance & Reporting</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Reports & Logs
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Generate compliance and usage reports for your records and regulatory submissions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Farm-wise Report */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-xl">
                                <Tractor className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Farm-wise AMU Report</CardTitle>
                                <CardDescription>Antimicrobial usage summary for a specific farm</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Select Farm</Label>
                            <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                                <SelectTrigger><SelectValue placeholder="Choose a farm..." /></SelectTrigger>
                                <SelectContent>
                                    {farms.map(farm => <SelectItem key={farm._id} value={farm._id}>{farm.farmName} ({farm.farmOwner})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {farmReportDateRange?.from ? (farmReportDateRange.to ? `${format(farmReportDateRange.from, "LLL dd, y")} - ${format(farmReportDateRange.to, "LLL dd, y")}` : format(farmReportDateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="range" selected={farmReportDateRange} onSelect={setFarmReportDateRange} numberOfMonths={2} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={handleGenerateFarmReport} disabled={isGeneratingFarmReport}>
                            {isGeneratingFarmReport ? (
                                <>
                                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Generate Farm Report
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Vet Signed Log */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>My Signed Treatment Logs</CardTitle>
                                <CardDescription>Export all treatment records you have verified</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Select Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {vetLogDateRange?.from ? (vetLogDateRange.to ? `${format(vetLogDateRange.from, "LLL dd, y")} - ${format(vetLogDateRange.to, "LLL dd, y")}` : format(vetLogDateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="range" selected={vetLogDateRange} onSelect={setVetLogDateRange} numberOfMonths={2} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={handleGenerateVetLog} disabled={isGeneratingVetLog}>
                            {isGeneratingVetLog ? (
                                <>
                                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Generate My Log
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Info Card */}
            <Card className="border-0 shadow-lg bg-blue-50">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">About Veterinary Reports</h3>
                            <p className="text-sm text-blue-800">
                                These reports provide comprehensive documentation of antimicrobial usage and treatment approvals.
                                Farm-wise reports can be shared with farmers or regulators, while your signed log serves as
                                professional documentation of your veterinary oversight activities.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VetReportsPage;