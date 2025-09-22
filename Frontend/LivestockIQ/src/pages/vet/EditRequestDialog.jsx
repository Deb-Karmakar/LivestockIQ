import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';

// Helper function
const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const dateOfBirth = new Date(dob);
    const ageDifMs = Date.now() - dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}, ${months} mo`;
    return `${months} month${months > 1 ? 's' : ''}`;
};

const EditRequestDialog = ({ request, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        drugName: request.drugName || '',
        dose: request.dose || '',
        route: request.route || '',
        vetNotes: request.vetNotes || '',
    });
    const [withdrawalDateRange, setWithdrawalDateRange] = useState({
        from: new Date(request.startDate),
        to: request.withdrawalEndDate ? new Date(request.withdrawalEndDate) : undefined,
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(request._id, { 
            ...formData, 
            startDate: withdrawalDateRange.from,
            withdrawalEndDate: withdrawalDateRange.to,
            status: 'Approved' 
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Review & Edit Treatment for Animal {request.animalId}</DialogTitle>
                    <DialogDescription>
                        Submitted by {request.farmerId.farmOwner}. Modify details as needed and approve.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4 space-y-4">
                        <Card className="p-4 bg-secondary">
                            <h4 className="font-semibold mb-2">Animal Details</h4>
                            {/* UPDATED: Removed Tag ID and adjusted grid to 4 columns */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="min-w-0">
                                    <p className="text-muted-foreground">Species</p>
                                    <p className="font-medium break-words">{request.animal?.species || 'N/A'}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground">Gender</p>
                                    <p className="font-medium break-words">{request.animal?.gender || 'N/A'}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground">Age</p>
                                    <p className="font-medium break-words">{calculateAge(request.animal?.dob)}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-muted-foreground">Weight</p>
                                    <p className="font-medium break-words">{request.animal?.weight || 'N/A'}</p>
                                </div>
                            </div>
                        </Card>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="drugName">Drug Name</Label>
                                <Input id="drugName" value={formData.drugName} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Withdrawal Period (Start - End)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {withdrawalDateRange?.from ? (
                                                withdrawalDateRange.to ? 
                                                `${format(withdrawalDateRange.from, "LLL dd, y")} - ${format(withdrawalDateRange.to, "LLL dd, y")}` :
                                                format(withdrawalDateRange.from, "LLL dd, y")
                                            ) : <span>Pick a date range</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={withdrawalDateRange}
                                            onSelect={setWithdrawalDateRange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dose">Dose</Label>
                                <Input id="dose" value={formData.dose} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="route">Route</Label>
                                <Input id="route" value={formData.route} onChange={handleChange} />
                            </div>
                        </div>

                        <Separator />
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label>Farmer's Notes</Label>
                                <Textarea value={request.notes || "No notes provided by the farmer."} readOnly className="bg-gray-50 h-24" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vetNotes">Vet's Notes & Instructions</Label>
                                <Textarea id="vetNotes" value={formData.vetNotes} onChange={handleChange} placeholder="Add any comments or instructions for the farmer..." />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save Changes & Approve</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditRequestDialog;