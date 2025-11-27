// frontend/src/pages/farmer/ReportsPage.jsx

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, FileDown, Sparkles, FileText, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { generateAmuReport } from '../../services/reportsService';

const ReportsPage = () => {
    const [dateRange, setDateRange] = useState(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
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

            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `AMU_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            document.body.appendChild(a);
            a.click();

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
                            Reports & Compliance
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Generate and export official documents for regulators, buyers, and veterinarians. Ensure compliance with antimicrobial usage regulations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Farm-Level AMU Usage Report */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Farm-Level AMU Report</CardTitle>
                                <CardDescription>Antimicrobial usage summary for a specific period</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <Label>Select Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal mt-2">
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
                        <Button
                            className="w-full bg-emerald-500 hover:bg-emerald-600"
                            onClick={handleGenerateReport}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Generate & Export Report
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Detailed Treatment History */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle>Detailed Treatment History</CardTitle>
                                <CardDescription>Comprehensive treatment records export</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 font-medium">Coming Soon</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Detailed, filterable exports will be available in a future update.
                            </p>
                            <p className="text-xs text-gray-400 mt-4">
                                Use the farm-level report above for now.
                            </p>
                        </div>
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
                            <h3 className="font-semibold text-blue-900 mb-2">About Compliance Reports</h3>
                            <p className="text-sm text-blue-800">
                                These reports are designed to meet regulatory requirements for antimicrobial usage tracking.
                                They include detailed information about all treatments, withdrawal periods, and compliance status.
                                You can share these reports with regulators, buyers, or certification bodies as needed.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsPage;