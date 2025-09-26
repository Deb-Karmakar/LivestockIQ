// frontend/src/components/animals/HealthTipDialog.jsx

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, BrainCircuit } from 'lucide-react';
import { getAnimalHealthTip } from '../../services/aiService';

const HealthTipDialog = ({ animal, isOpen, onClose }) => {
    const [tip, setTip] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && animal) {
            const fetchTip = async () => {
                setIsLoading(true);
                setTip(''); // Clear previous tip
                try {
                    const data = await getAnimalHealthTip(animal._id);
                    setTip(data.tip);
                } catch (error) {
                    setTip('Sorry, I was unable to generate a health tip at this time. Please try again later.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTip();
        }
    }, [isOpen, animal]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-blue-600" /> 
                        AI Health Tip for {animal?.name || animal?.tagId}
                    </DialogTitle>
                    <DialogDescription>
                        A personalized tip based on this animal's profile and recent health history.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            <p className="ml-4 text-gray-500">Generating tip...</p>
                        </div>
                    ) : (
                        <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-md border border-blue-200">
                            {tip}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HealthTipDialog;