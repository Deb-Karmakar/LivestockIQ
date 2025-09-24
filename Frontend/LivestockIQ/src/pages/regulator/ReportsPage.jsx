// frontend/src/pages/regulator/ReportsPage.jsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FileDown, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { generateComplianceReport } from '../../services/regulatorService';

const RegulatorReportsPage = () => {
    const [dateRange, setDateRange] = useState(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerateReport = async () => {
        if (!dateRange || !dateRange.from || !dateRange.to) {
            return toast({
                variant: 'destructive',
                title: "Invalid Date Range",
                description: "Please select a start and end date.",
            });
        }
        
        setIsGenerating(true);
        try {
            const data = await generateComplianceReport({
                from: dateRange.from.toISOString(),
                to: dateRange.to.toISOString()
            });

            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Compliance_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate the report." });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Reports</h1>
                <p className="mt-1 text-gray-600">Generate and export official compliance documents.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Exportable Compliance Report</CardTitle>
                    <CardDescription>
                        Generate a comprehensive compliance report for a specified time period.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")
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
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Generating...' : 'Generate & Export Report'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegulatorReportsPage;