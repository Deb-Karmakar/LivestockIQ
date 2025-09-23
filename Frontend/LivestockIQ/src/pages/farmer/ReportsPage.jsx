// frontend/src/pages/farmer/ReportsPage.jsx

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, FileDown, Loader2 } from 'lucide-react'; // Added Loader2 icon
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { generateAmuReport } from '../../services/reportsService'; // Import the new service

const ReportsPage = () => {
    const [dateRange, setDateRange] = useState(undefined);
    const [isGenerating, setIsGenerating] = useState(false); // State to track report generation
    const { toast } = useToast();

    const handleGenerateReport = async () => {
        if (!dateRange || !dateRange.from || !dateRange.to) {
            toast({
                variant: 'destructive',
                title: "Invalid Date Range",
                description: "Please select a valid start and end date.",
            });
            return;
        }
        
        setIsGenerating(true);
        try {
            const data = await generateAmuReport({
                from: dateRange.from.toISOString(),
                to: dateRange.to.toISOString()
            });

            // Create a Blob from the PDF stream
            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link to trigger the download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `AMU_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({ title: "Success", description: "Your report has been downloaded." });

        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate the report." });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Reports & Compliance</h1>
                <p className="mt-1 text-gray-600">Generate and export official documents for regulators, buyers, and vets.</p>
            </div>

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
                    <Button className="w-full" onClick={handleGenerateReport} disabled={isGenerating}>
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileDown className="mr-2 h-4 w-4" />
                        )}
                        {isGenerating ? 'Generating Report...' : 'Generate & Export Report'}
                    </Button>
                </CardContent>
            </Card>

            {/* The second card for detailed history can be made functional in a similar way later */}
            <Card>
                <CardHeader>
                    <CardTitle>Export Detailed Treatment History</CardTitle>
                    <CardDescription>This feature is coming soon. Use the farm-level report above for now.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-gray-500 text-center py-4">Detailed, filterable exports will be available in a future update.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsPage;