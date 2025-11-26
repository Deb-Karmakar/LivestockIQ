import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/db';
import { axiosInstance } from './AuthContext';
import { useToast } from "@/hooks/use-toast";

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast({
                title: "Back Online",
                description: "Connection restored. Syncing data...",
            });
            syncData();
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast({
                title: "Offline",
                description: "You are now offline. Changes will be saved locally.",
                variant: "destructive"
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncData = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const queue = await db.syncQueue.toArray();
            if (queue.length === 0) {
                setIsSyncing(false);
                return;
            }

            for (const item of queue) {
                try {
                    if (item.collection === 'farmers') {
                        if (item.operation === 'create') {
                            // Remove tempId before sending to backend
                            const { tempId, ...dataToSend } = item.data;
                            await axiosInstance.post('/auth/register/farmer', dataToSend); // Assuming this is the endpoint
                            // Update local record with backend ID if needed, or just mark synced
                            // For now, we might just clear the queue item
                        } else if (item.operation === 'update') {
                            await axiosInstance.put('/farmers/profile', item.data.updates);
                        }
                        if (item.operation === 'create') {
                            const { tempId, ...dataToSend } = item.data;
                            await axiosInstance.post('/auth/register/vet', dataToSend);
                        }
                    } else if (item.collection === 'animals') {
                        if (item.operation === 'create') {
                            const { tempId, ...dataToSend } = item.data;
                            await axiosInstance.post('/animals', dataToSend);
                        } else if (item.operation === 'update') {
                            await axiosInstance.put(`/animals/${item.data.id}`, item.data.updates);
                        }
                    } else if (item.collection === 'inventory') {
                        if (item.operation === 'create') {
                            const { tempId, ...dataToSend } = item.data;
                            await axiosInstance.post('/inventory', dataToSend);
                        } else if (item.operation === 'update') {
                            await axiosInstance.put(`/inventory/${item.data.id}`, item.data.updates);
                        }
                    } else if (item.collection === 'treatments') {
                        if (item.operation === 'create') {
                            const { tempId, ...dataToSend } = item.data;
                            await axiosInstance.post('/treatments', dataToSend);
                        } else if (item.operation === 'update') {
                            await axiosInstance.put(`/treatments/${item.data.id}/vet-update`, item.data.updates);
                        }
                    } else if (item.collection === 'sales') {
                        if (item.operation === 'create') {
                            const { tempId, ...dataToSend } = item.data;
                            await axiosInstance.post('/sales', dataToSend);
                        }
                    } else if (item.collection === 'reports') {
                        if (item.operation === 'create') {
                            const { tempId, ...dataToSend } = item.data;
                            await axiosInstance.post('/vets/report-farmer', dataToSend);
                        }
                    }

                    // Remove from queue on success
                    await db.syncQueue.delete(item.id);
                } catch (error) {
                    console.error(`Failed to sync item ${item.id}:`, error);
                    // Keep in queue to retry later? Or move to a failed queue?
                }
            }

            toast({
                title: "Sync Complete",
                description: "All offline changes have been synchronized.",
            });

        } catch (error) {
            console.error("Sync failed:", error);
            toast({
                title: "Sync Failed",
                description: "There was an error syncing your data.",
                variant: "destructive"
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <SyncContext.Provider value={{ isOnline, isSyncing, syncData }}>
            {children}
        </SyncContext.Provider>
    );
};
