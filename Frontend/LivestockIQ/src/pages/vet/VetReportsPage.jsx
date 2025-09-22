import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, FileDown, Tractor, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';

// --- Mock Data ---
const mockFarms = [
    { id: 'FARM-01', name: 'Green Valley Farms' },
    { id: 'FARM-02', name: 'Sunrise Dairy' },
    { id: 'FARM-03', name: 'Himalayan Goats Co.' },
];

// --- Main Vet's Reports Page Component ---
const VetReportsPage = () => {
    const [farmReportDateRange, setFarmReportDateRange] = useState(undefined);
    const [vetLogDateRange, setVetLogDateRange] = useState(undefined);

    const handleGenerateFarmReport = () => {
        if (!farmReportDateRange?.from || !farmReportDateRange?.to) {
            alert("Please select a valid date range for the farm report.");
            return;
        }
        alert(`Generating farm report from ${format(farmReportDateRange.from, 'PPP')} to ${format(farmReportDateRange.to, 'PPP')}.`);
    };
    
    const handleGenerateVetLog = () => {
        if (!vetLogDateRange?.from || !vetLogDateRange?.to) {
            alert("Please select a valid date range for your signed log.");
            return;
        }
        alert(`Generating your signed log from ${format(vetLogDateRange.from, 'PPP')} to ${format(vetLogDateRange.to, 'PPP')}.`);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Reports & Logs</h1>
                <p className="mt-1 text-gray-600">Generate compliance and usage reports for your records.</p>
            </div>

            {/* Farm-wise AMU Usage Report */}
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
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Choose a farm..." /></SelectTrigger>
                                <SelectContent>{mockFarms.map(farm => <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>)}</SelectContent>
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
                    <Button className="w-full" onClick={handleGenerateFarmReport}>
                        <FileDown className="mr-2 h-4 w-4" /> Generate Farm Report
                    </Button>
                </CardContent>
            </Card>

            {/* Vet's Signed Logs */}
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
                    <Button className="w-full" onClick={handleGenerateVetLog}>
                        <FileDown className="mr-2 h-4 w-4" /> Generate My Log
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default VetReportsPage;