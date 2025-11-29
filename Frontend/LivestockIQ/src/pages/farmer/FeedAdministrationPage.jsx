import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, CalendarIcon, ShieldCheck, ShieldAlert, Shield, Clock, Sparkles, Package, CheckCircle2, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { getAnimals } from '../../services/animalService';
import { getActiveFeed } from '../../services/feedService';
import { getFeedAdministrations, recordFeedAdministration, getActivePrograms, completeFeedingProgram, getWithdrawalStatus } from '../../services/feedAdministrationService';

// Animal history dialog component added
const AnimalHistoryDialog = ({ animal, administrations }) => {
    const animalAdmins = (administrations || []).filter(admin =>
        (admin.animalIds || []).includes(animal.tagId)
    );
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-blue-100">
                    {animal.tagId}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        Feed History: {animal.name || animal.tagId}
                    </DialogTitle>
                    <CardDescription>
                        Species: {animal.species} | Tag ID: {animal.tagId}
                    </CardDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                    {animalAdmins.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p>No feed administration history</p>
                        </div>
                    ) : (
                        animalAdmins.map((admin, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border ${admin.feedId?.prescriptionRequired
                                ? 'bg-red-50 border-red-200'
                                : 'bg-blue-50 border-blue-200'
                                }`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="font-semibold">{admin.feedId?.feedName}</div>
                                    <Badge className={admin.feedId?.prescriptionRequired ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                                        {admin.feedId?.prescriptionRequired ? 'Medicated' : 'Non-Medicated'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-slate-600">Antimicrobial:</span> {admin.feedId?.antimicrobialName || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Quantity:</span> {admin.feedQuantityUsed} {admin.feedId?.unit}
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Start:</span> {admin.startDate ? format(new Date(admin.startDate), 'MMM d, yyyy') : 'N/A'}
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Status:</span> {admin.status}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const WithdrawalStatusBadge = ({ status }) => {
    const config = {
        safe: { text: 'Safe for Sale', color: 'bg-green-100 text-green-800 border-green-300', icon: <ShieldCheck className="h-3 w-3" /> },
        ending_soon: { text: 'Ending Soon', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <ShieldAlert className="h-3 w-3" /> },
        active: { text: 'Active Withdrawal', color: 'bg-red-100 text-red-800 border-red-300', icon: <Shield className="h-3 w-3" /> },
        pending: { text: 'Pending Approval', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: <Clock className="h-3 w-3" /> },
    };
    const finalConfig = config[status] || config['pending'];
    return <Badge className={`flex items-center gap-1.5 border ${finalConfig.color}`}>{finalConfig.icon}{finalConfig.text}</Badge>;
};

// Updated FeedAdministrationCard signature and logic
const FeedAdministrationCard = ({ admin, animals = [], allAdministrations = [], onComplete }) => {
    const isMedicated = admin.feedId?.prescriptionRequired !== false;
    const cardAnimals = (animals || []).filter(a => (admin.animalIds || []).includes(a.tagId));

    const getWithdrawalInfo = () => {
        if (!isMedicated) return { daysLeft: 'N/A', status: 'safe' };
        if (!admin.withdrawalEndDate) return { daysLeft: 'N/A', status: 'pending' };
        const endDate = new Date(admin.withdrawalEndDate);
        const daysLeft = differenceInDays(endDate, new Date());
        let status;
        if (daysLeft < 0) status = 'safe';
        else if (daysLeft <= 5) status = 'ending_soon';
        else status = 'active';
        return { daysLeft: daysLeft > 0 ? daysLeft : 0, status };
    };

    const { daysLeft, status: withdrawalStatus } = getWithdrawalInfo();

    return (
        <Card className={`hover:shadow-lg transition-shadow ${isMedicated ? 'border-l-4 border-l-red-500 bg-red-50/30' : 'border-l-4 border-l-blue-500 bg-blue-50/30'
            }`}>
            <CardHeader className="pb-3 space-y-3">
                {/* Title and Icon */}
                <div className="flex items-start gap-2">
                    <Package className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isMedicated ? 'text-red-600' : 'text-blue-600'}`} />
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg leading-tight break-words">
                            {admin.feedId?.feedName || 'Unknown Feed'}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                            {admin.groupName ? `Group: ${admin.groupName}` : `${cardAnimals.length} animal(s)`}
                        </CardDescription>
                    </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-2">
                    <Badge className={`text-xs ${isMedicated
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                        } border`}>
                        {isMedicated ? 'Medicated' : 'Non-Medicated'}
                    </Badge>
                    <WithdrawalStatusBadge status={withdrawalStatus} />
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Withdrawal Status Display - Prominent at top */}
                {isMedicated && withdrawalStatus !== 'pending' ? (
                    <div className={`rounded-xl p-5 text-center shadow-sm ${withdrawalStatus === 'safe' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' :
                        withdrawalStatus === 'ending_soon' ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300' :
                            'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300'
                        }`}>
                        <div className="text-4xl sm:text-5xl font-bold mb-2">
                            {daysLeft === 0 ? '✓' : daysLeft}
                        </div>
                        <div className="text-sm sm:text-base font-semibold mb-1">
                            {daysLeft === 0 ? 'Withdrawal Complete' : `Day${daysLeft > 1 ? 's' : ''} Until Safe`}
                        </div>
                        <div className="text-xs text-slate-600">
                            {withdrawalStatus === 'safe' ? 'Ready for sale' :
                                withdrawalStatus === 'ending_soon' ? 'Withdrawal ending soon' :
                                    'Active withdrawal period'}
                        </div>
                    </div>
                ) : !isMedicated ? (
                    <div className="rounded-xl p-5 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm">
                        <div className="text-4xl sm:text-5xl font-bold mb-2 text-green-600">✓</div>
                        <div className="text-sm sm:text-base font-semibold text-green-800 mb-1">Safe for Sale</div>
                        <div className="text-xs text-green-700">No Withdrawal Period</div>
                    </div>
                ) : null}

                {/* Animals Section - Collapsible on mobile */}
                {cardAnimals.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border shadow-sm">
                        <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Animals in this batch: {cardAnimals.length}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {cardAnimals.slice(0, 10).map(animal => (
                                <AnimalHistoryDialog
                                    key={animal.tagId}
                                    animal={animal}
                                    administrations={allAdministrations}
                                />
                            ))}
                            {cardAnimals.length > 10 && (
                                <Badge variant="outline" className="text-xs">
                                    +{cardAnimals.length - 10} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Info Grid - Better mobile layout */}
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3 border">
                            <div className="text-xs text-slate-500 mb-1">Antimicrobial</div>
                            <div className="font-semibold text-sm break-words">{admin.feedId?.antimicrobialName || 'N/A'}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 border">
                            <div className="text-xs text-slate-500 mb-1">Quantity Used</div>
                            <div className="font-semibold text-sm">{admin.feedQuantityUsed} {admin.feedId?.unit || 'kg'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3 border">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                Start Date
                            </div>
                            <div className="font-semibold text-xs sm:text-sm">
                                {admin.startDate ? format(new Date(admin.startDate), 'MMM d, yyyy') : 'N/A'}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 border">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {admin.endDate ? 'End Date' : 'Expected End'}
                            </div>
                            <div className="font-semibold text-xs sm:text-sm">
                                {admin.endDate ? format(new Date(admin.endDate), 'MMM d, yyyy') :
                                    admin.withdrawalEndDate ? format(new Date(admin.withdrawalEndDate), 'MMM d, yyyy') : 'Ongoing'}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const FeedAdministrationPage = () => {
    const [administrations, setAdministrations] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [activeFeed, setActiveFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [adminData, animalsData, feedData] = await Promise.all([
                getFeedAdministrations(),
                getAnimals(),
                getActiveFeed()
            ]);
            setAdministrations(Array.isArray(adminData) ? adminData : []);
            setAnimals(Array.isArray(animalsData) ? animalsData : []);
            setActiveFeed(Array.isArray(feedData) ? feedData : []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load data." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRecord = async (data) => {
        try {
            const response = await recordFeedAdministration(data);

            // Download PDF if provided
            if (response.pdfBuffer) {
                const byteCharacters = atob(response.pdfBuffer);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Feed_Confirmation_${Date.now()}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }

            toast({ title: "Success", description: "Feed recorded! Confirmation PDF downloaded. Vet notified." });
            fetchData();
            setIsFormOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to record." });
        }
    };

    const handleComplete = async (id) => {
        if (window.confirm('Are you sure you want to mark this feeding program as complete?')) {
            try {
                await completeFeedingProgram(id, new Date().toISOString());
                toast({ title: "Success", description: "Feeding program marked as complete." });
                fetchData();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to complete program." });
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-gray-500 font-medium">Loading feed administrations...</p>
            </div>
        );
    };

    const stats = {
        total: administrations.length,
        active: administrations.filter(a => a.status === 'Active' && !a.endDate).length,
        pending: administrations.filter(a => a.status === 'Pending Approval').length,
        completed: administrations.filter(a => a.status === 'Completed' || a.endDate).length
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Feed Administration</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Medicated Feed Tracking
                        </h1>
                        <p className="text-slate-400 max-w-md">
                            Record and track medicated feed usage. You have{' '}
                            <span className="text-blue-400 font-semibold">{stats.active} active programs</span> and{' '}
                            <span className="text-amber-400 font-semibold">{stats.pending} pending approval</span>.
                        </p>
                    </div>

                    <div className="w-full lg:w-auto">
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="lg"
                                    className="w-full lg:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Record Feed Use
                                </Button>
                            </DialogTrigger>
                            {isFormOpen && (
                                <FeedAdminFormDialog
                                    onSave={handleRecord}
                                    onClose={() => setIsFormOpen(false)}
                                    animals={animals}
                                    activeFeed={activeFeed}
                                />
                            )}
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle>Feed Administration History</CardTitle>
                            <CardDescription>All recorded medicated feed usage with withdrawal status.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {administrations.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {administrations.map(admin => (
                                <FeedAdministrationCard
                                    key={admin._id}
                                    admin={admin}
                                    animals={animals}
                                    allAdministrations={administrations}
                                    onComplete={handleComplete}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-600">No feed administrations recorded yet.</p>
                            <p className="text-sm text-gray-500 mt-1">Click "Record Feed Use" to start tracking.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const FeedAdminFormDialog = ({ onSave, onClose, animals, activeFeed }) => {
    const [startDate, setStartDate] = useState(new Date());
    const [selectedAnimals, setSelectedAnimals] = useState([]);
    const [isGroupFeeding, setIsGroupFeeding] = useState(false);
    // Filter animals - only show those eligible for feed (SAFE or NEW status)
    const eligibleAnimals = (animals || []).filter(animal =>
        animal.mrlStatus === 'SAFE' ||
        animal.mrlStatus === 'NEW' ||
        !animal.mrlStatus // Handle cases where mrlStatus might not be set
    );
    const ineligibleCount = (animals || []).length - eligibleAnimals.length;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            feedId: formData.get('feedId'),
            animalIds: isGroupFeeding ? selectedAnimals : [formData.get('animalId')],
            groupName: isGroupFeeding ? formData.get('groupName') : undefined,
            feedQuantityUsed: Number(formData.get('feedQuantityUsed')),
            startDate: startDate,
            notes: formData.get('notes')
        };
        onSave(data);
    };

    const handleAnimalToggle = (animalId) => {
        setSelectedAnimals(prev =>
            prev.includes(animalId)
                ? prev.filter(id => id !== animalId)
                : [...prev, animalId]
        );
    };

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Record Feed Administration</DialogTitle>
            </DialogHeader>
            {/* Warning about ineligible animals */}
            {ineligibleCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-800">
                        <strong>{ineligibleCount} animal(s)</strong> are currently not eligible for new feed administrations due to active withdrawal periods, pending tests, or verification.
                    </p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="feedId">Select Feed *</Label>
                    <Select name="feedId" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose medicated feed" />
                        </SelectTrigger>
                        <SelectContent>
                            {activeFeed.map(feed => (
                                <SelectItem key={feed._id} value={feed._id}>
                                    {feed.feedName} - {feed.antimicrobialName} ({feed.remainingQuantity} {feed.unit} remaining)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Feeding Type</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={!isGroupFeeding}
                                onChange={() => setIsGroupFeeding(false)}
                            />
                            <span>Single Animal</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                checked={isGroupFeeding}
                                onChange={() => setIsGroupFeeding(true)}
                            />
                            <span>Group/Batch</span>
                        </label>
                    </div>
                </div>

                {!isGroupFeeding ? (
                    <div className="space-y-2">
                        <Label htmlFor="animalId">Animal *</Label>
                        <Select name="animalId" required={!isGroupFeeding}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select animal" />
                            </SelectTrigger>
                            <SelectContent>
                                {eligibleAnimals.map(animal => (
                                    <SelectItem key={animal._id} value={animal.tagId}>
                                        {animal.tagId} - {animal.name || animal.species}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="groupName">Group Name *</Label>
                            <Input id="groupName" name="groupName" placeholder="e.g., Pen 1 - Broilers" required={isGroupFeeding} />
                        </div>
                        <div className="space-y-2">
                            <Label>Select Animals ({selectedAnimals.length} selected)</Label>
                            <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                                {eligibleAnimals.map(animal => (
                                    <label key={animal._id} className="flex items-center gap-2 py-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedAnimals.includes(animal.tagId)}
                                            onChange={() => handleAnimalToggle(animal.tagId)}
                                        />
                                        <span className="text-sm">{animal.tagId} - {animal.name || animal.species}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="feedQuantityUsed">Quantity Used *</Label>
                        <Input id="feedQuantityUsed" name="feedQuantityUsed" type="number" step="0.01" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Start Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(startDate, 'PPP')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input id="notes" name="notes" placeholder="Additional information" />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Record Feed Use</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default FeedAdministrationPage;
