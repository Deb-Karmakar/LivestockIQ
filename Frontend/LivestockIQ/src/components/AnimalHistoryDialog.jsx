// frontend/src/components/AnimalHistoryDialog.jsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getAnimalHistory } from '../services/animalService';
import { format } from 'date-fns';
import { PawPrint, Syringe, ShoppingCart, Loader2 } from 'lucide-react';

const eventIcons = {
    LOGGED: <PawPrint className="h-5 w-5 text-gray-500" />,
    TREATMENT: <Syringe className="h-5 w-5 text-blue-500" />,
    SALE: <ShoppingCart className="h-5 w-5 text-green-500" />,
};

const AnimalHistoryDialog = ({ animalId, isOpen, onClose }) => {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && animalId) {
            const fetchHistory = async () => {
                try {
                    setLoading(true);
                    setError('');
                    const data = await getAnimalHistory(animalId);
                    setHistory(data);
                } catch (err) {
                    setError('Failed to load animal history.');
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen, animalId]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>History for Animal ID: {animalId}</DialogTitle>
                    {history?.animalDetails && (
                        <DialogDescription>
                            {history.animalDetails.name} • {history.animalDetails.species} • {history.animalDetails.gender}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-4">
                    {loading && <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                    {error && <p className="text-red-500">{error}</p>}
                    {history && (
                        <div className="relative border-l-2 border-gray-200 ml-4">
                            {history.timeline.map((event, index) => (
                                <div key={index} className="mb-8 ml-8">
                                    <span className="absolute -left-4 flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full ring-8 ring-white">
                                        {eventIcons[event.type]}
                                    </span>
                                    <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                                        {event.title}
                                    </h3>
                                    <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                                        {format(new Date(event.date), 'PPP')}
                                    </time>
                                    <p className="text-base font-normal text-gray-600">{event.details}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AnimalHistoryDialog;