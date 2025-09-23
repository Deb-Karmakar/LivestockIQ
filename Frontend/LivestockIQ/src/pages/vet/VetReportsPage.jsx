// frontend/src/pages/vet/VetReportsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, FileDown, Tractor, ClipboardCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { axiosInstance } from '../../contexts/AuthContext'; // To fetch farmers
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
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate your signed log.' });
        } finally {
            setIsGeneratingVetLog(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Reports & Logs</h1>
                <p className="mt-1 text-gray-600">Generate compliance and usage reports for your records.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Tractor className="w-6 h-6 text-green-600" />
                        <div>
                            <CardTitle>Farm-wise AMU Usage Report</CardTitle>
                            <CardDescription>Generate a summary of antimicrobial usage for a specific farm.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    <Button className="w-full" onClick={handleGenerateFarmReport} disabled={isGeneratingFarmReport}>
                        {isGeneratingFarmReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        {isGeneratingFarmReport ? 'Generating...' : 'Generate Farm Report'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ClipboardCheck className="w-6 h-6 text-blue-600" />
                        <div>
                            <CardTitle>My Signed Treatment Logs</CardTitle>
                            <CardDescription>Export a log of all treatment records you have personally signed and verified.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Button className="w-full" onClick={handleGenerateVetLog} disabled={isGeneratingVetLog}>
                         {isGeneratingVetLog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        {isGeneratingVetLog ? 'Generating...' : 'Generate My Log'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default VetReportsPage;