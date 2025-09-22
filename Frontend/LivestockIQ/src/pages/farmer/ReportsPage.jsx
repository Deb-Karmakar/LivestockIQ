import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, FileDown } from 'lucide-react';
import { format } from 'date-fns';

// --- Mock Data ---
const mockAnimals = [
    { id: '342987123456', species: 'Cattle' },
    { id: '342987123457', species: 'Cattle' },
    { id: '458921789123', species: 'Goat' },
];
const mockDrugs = ['Enrofloxacin', 'Amoxicillin', 'Ivermectin'];

// --- Main Reports Page Component ---
const ReportsPage = () => {
    const [dateRange, setDateRange] = useState(undefined);

    const handleGenerateReport = () => {
        if (!dateRange || !dateRange.from || !dateRange.to) {
            alert("Please select a valid date range.");
            return;
        }
        alert(`Generating farm-level AMU report from ${format(dateRange.from, 'PPP')} to ${format(dateRange.to, 'PPP')}.`);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Reports & Compliance</h1>
                <p className="mt-1 text-gray-600">Generate and export official documents for regulators, buyers, and vets.</p>
            </div>

            {/* Main Reporting Section */}
            <div className="space-y-8">
                {/* Farm-Level AMU Usage Report */}
                <Card>
                    <CardHeader>
                        <CardTitle>Farm-Level AMU Usage Report</CardTitle>
                        <CardDescription>Generate a summary of all antimicrobial usage across your farm for a specific period.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Select Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button className="w-full" onClick={handleGenerateReport}>
                            <FileDown className="mr-2 h-4 w-4" /> Generate & Export Report
                        </Button>
                    </CardContent>
                </Card>

                {/* Export Detailed History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Export Detailed Treatment History</CardTitle>
                        <CardDescription>Export granular treatment data. Use the filters to narrow your results.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Filter by Animal</Label>
                            <Select><SelectTrigger><SelectValue placeholder="All Animals" /></SelectTrigger><SelectContent>{mockAnimals.map(a => <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Filter by Drug</Label>
                            <Select><SelectTrigger><SelectValue placeholder="All Drugs" /></SelectTrigger><SelectContent>{mockDrugs.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                        </div>
                         <div className="flex items-end">
                            <Button className="w-full">
                                <FileDown className="mr-2 h-4 w-4" /> Export Filtered Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReportsPage;

