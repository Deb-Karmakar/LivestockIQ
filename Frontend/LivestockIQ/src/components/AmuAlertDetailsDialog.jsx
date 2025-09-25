// frontend/src/components/AmuAlertDetailsDialog.jsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getHighAmuAlertDetails } from '../services/farmerService';

const AmuAlertDetailsDialog = ({ alertId, isOpen, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && alertId) {
            const fetchDetails = async () => {
                setLoading(true);
                setDetails(null); // Clear previous details
                try {
                    const data = await getHighAmuAlertDetails(alertId);
                    setDetails(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        }
    }, [isOpen, alertId]);

    const TreatmentTable = ({ treatments }) => (
        <Table>
            <TableHeader><TableRow><TableHead>Animal ID</TableHead><TableHead>Drug</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
                {treatments.map(t => (
                    <TableRow key={t._id}>
                        <TableCell>{t.animalId}</TableCell>
                        <TableCell>{t.drugName}</TableCell>
                        <TableCell>{format(new Date(t.createdAt), 'PPP')}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        }
        if (!details || !details.alert) {
            return <p>Could not load alert details.</p>;
        }

        // UPDATED: Conditionally render content based on the alert type
        if (details.alert.alertType === 'PEER_COMPARISON_SPIKE') {
            return (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <p className="font-semibold">Your farm had <span className="font-bold text-lg">{details.alert.details.farmMonthlyUsage}</span> treatments last month.</p>
                        <p>The average for similar farms was <span className="font-bold text-lg">{details.alert.details.peerMonthlyAverage}</span>.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Your Treatments from the Past Month</h3>
                        <TreatmentTable treatments={details.farmMonthlyTreatments} />
                    </div>
                </div>
            );
        }

        // Default to the historical spike view
        return (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                    <h3 className="font-semibold mb-2">Recent Spike ({details.spikeTreatments.length} treatments last week)</h3>
                    <TreatmentTable treatments={details.spikeTreatments} />
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Historical Baseline (representative sample)</h3>
                    <TreatmentTable treatments={details.baselineTreatments.slice(0, 5)} />
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>High AMU Alert Details</DialogTitle>
                    <DialogDescription>{details?.alert.message}</DialogDescription>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
};

export default AmuAlertDetailsDialog;