// frontend/src/pages/lab/UploadMRLTestPage.jsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import {
    FlaskConical,
    Search,
    CheckCircle2,
    XCircle,
    Loader2,
    Sparkles,
    Upload
} from 'lucide-react';
import { uploadMRLTest, findAnimalByTagId } from '../../services/labService';
import { useToast } from '../../hooks/use-toast';

const UploadMRLTestPage = () => {
    const [animalInfo, setAnimalInfo] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        animalId: '',
        drugName: '',
        sampleType: 'Blood',
        productType: 'Meat',
        residueLevelDetected: '',
        unit: 'µg/kg',
        mrlThreshold: '',
        testDate: new Date().toISOString().split('T')[0],
        testReportNumber: '',
        certificateUrl: '',
        notes: ''
    });

    const handleAnimalSearch = async () => {
        if (!formData.animalId || formData.animalId.length < 12) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid 12-digit Animal Tag ID' });
            return;
        }

        setSearchLoading(true);
        setAnimalInfo(null);
        try {
            const data = await findAnimalByTagId(formData.animalId);
            setAnimalInfo(data);
            toast({ title: 'Animal Found', description: `${data.name || data.tagId} - ${data.farmer?.farmName || 'Unknown Farm'}` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Animal Not Found', description: 'No animal found with this Tag ID' });
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!animalInfo) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please search and verify an animal first' });
            return;
        }

        if (!formData.drugName || !formData.residueLevelDetected || !formData.mrlThreshold || !formData.testReportNumber || !formData.certificateUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields' });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await uploadMRLTest(formData);
            toast({
                title: result.isPassed ? 'Test Passed' : 'Test Failed',
                description: result.message,
                variant: result.isPassed ? 'default' : 'destructive'
            });
            navigate('/lab/test-history');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to upload test' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate preview result
    const isPassed = formData.residueLevelDetected && formData.mrlThreshold
        ? parseFloat(formData.residueLevelDetected) <= parseFloat(formData.mrlThreshold)
        : null;

    return (
        <div className="space-y-8 pb-8 max-w-3xl mx-auto">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />

                <div className="relative space-y-2">
                    <div className="flex items-center gap-2 text-purple-300 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        <span>MRL Compliance</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold">Upload MRL Test Result</h1>
                    <p className="text-purple-200">Enter test results for an animal to update their MRL compliance status</p>
                </div>
            </div>

            {/* Animal Search */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-gray-400" />
                        Step 1: Find Animal
                    </CardTitle>
                    <CardDescription>Enter the 12-digit animal tag ID</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter 12-digit Animal Tag ID"
                            value={formData.animalId}
                            onChange={(e) => setFormData(prev => ({ ...prev, animalId: e.target.value }))}
                            maxLength={12}
                            className="font-mono text-lg"
                        />
                        <Button
                            onClick={handleAnimalSearch}
                            disabled={searchLoading || formData.animalId.length < 12}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>

                    {animalInfo && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-800">{animalInfo.name || animalInfo.tagId}</p>
                                    <p className="text-sm text-green-600">
                                        {animalInfo.species} • {animalInfo.farmer?.farmName} ({animalInfo.farmer?.name})
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Test Details Form */}
            {animalInfo && (
                <form onSubmit={handleSubmit}>
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FlaskConical className="w-5 h-5 text-gray-400" />
                                Step 2: Enter Test Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Drug and Sample Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="drugName">Drug/Substance Tested <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="drugName"
                                        value={formData.drugName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, drugName: e.target.value }))}
                                        placeholder="e.g., Oxytetracycline"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sample Type <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.sampleType}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, sampleType: value }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Milk">Milk</SelectItem>
                                            <SelectItem value="Blood">Blood</SelectItem>
                                            <SelectItem value="Meat">Meat</SelectItem>
                                            <SelectItem value="Tissue">Tissue</SelectItem>
                                            <SelectItem value="Urine">Urine</SelectItem>
                                            <SelectItem value="Eggs">Eggs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Product Type */}
                            <div className="space-y-2">
                                <Label>Product Type <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.productType}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Milk">Milk</SelectItem>
                                        <SelectItem value="Meat">Meat</SelectItem>
                                        <SelectItem value="Eggs">Eggs</SelectItem>
                                        <SelectItem value="Honey">Honey</SelectItem>
                                        <SelectItem value="Fish">Fish</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Residue Levels */}
                            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                                <h4 className="font-medium">Test Results</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="residueLevelDetected">Residue Detected <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="residueLevelDetected"
                                            type="number"
                                            step="0.01"
                                            value={formData.residueLevelDetected}
                                            onChange={(e) => setFormData(prev => ({ ...prev, residueLevelDetected: e.target.value }))}
                                            placeholder="e.g., 50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Unit</Label>
                                        <Select
                                            value={formData.unit}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="µg/kg">µg/kg</SelectItem>
                                                <SelectItem value="ppb">ppb</SelectItem>
                                                <SelectItem value="mg/kg">mg/kg</SelectItem>
                                                <SelectItem value="ppm">ppm</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mrlThreshold">MRL Threshold <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="mrlThreshold"
                                            type="number"
                                            step="0.01"
                                            value={formData.mrlThreshold}
                                            onChange={(e) => setFormData(prev => ({ ...prev, mrlThreshold: e.target.value }))}
                                            placeholder="e.g., 100"
                                        />
                                    </div>
                                </div>

                                {/* Preview Result */}
                                {isPassed !== null && (
                                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 ${isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {isPassed ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                <span className="text-green-800 font-medium">TEST WILL PASS - {formData.residueLevelDetected} ≤ {formData.mrlThreshold} {formData.unit}</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-5 h-5 text-red-600" />
                                                <span className="text-red-800 font-medium">TEST WILL FAIL - {formData.residueLevelDetected} {'>'} {formData.mrlThreshold} {formData.unit}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Report Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="testReportNumber">Lab Report Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="testReportNumber"
                                        value={formData.testReportNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, testReportNumber: e.target.value }))}
                                        placeholder="e.g., RPT-2024-12345"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="testDate">Test Date</Label>
                                    <Input
                                        id="testDate"
                                        type="date"
                                        value={formData.testDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, testDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Certificate URL */}
                            <div className="space-y-2">
                                <Label htmlFor="certificateUrl">Certificate/Report URL <span className="text-red-500">*</span></Label>
                                <Input
                                    id="certificateUrl"
                                    value={formData.certificateUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, certificateUrl: e.target.value }))}
                                    placeholder="https://example.com/lab-report.pdf"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional observations or notes..."
                                    rows={2}
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/lab/dashboard')}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload Test Result
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            )}
        </div>
    );
};

export default UploadMRLTestPage;
