// frontend/src/pages/regulator/ReportsPage.jsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FileDown, Calendar as CalendarIcon, Loader2, Sparkles } from 'lucide-react';
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
                            <span>Reports</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Reports
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Generate and export official compliance documents for specified time periods.
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Generation Card */}
            <Card className="border-0 shadow-lg max-w-2xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <CardTitle>Exportable Compliance Report</CardTitle>
                    <CardDescription>
                        Generate a comprehensive compliance report for a specified time period
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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