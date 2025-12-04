import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetwork } from './NetworkContext';
import * as animalService from '../services/animalService';

import * as inventoryService from '../services/inventoryService';
import * as vetService from '../services/vetService';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
    const [syncQueue, setSyncQueue] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const { isConnected } = useNetwork();

    useEffect(() => {
        loadQueue();
    }, []);

    useEffect(() => {
        if (isConnected) {
            sync();
        }
    }, [isConnected]);

    const loadQueue = async () => {
        try {
            const queue = await AsyncStorage.getItem('offlineSyncQueue');
            if (queue) {
                setSyncQueue(JSON.parse(queue));
            }
        } catch (error) {
            console.error('Failed to load sync queue', error);
        }
    };

    const saveQueue = async (queue) => {
        try {
            await AsyncStorage.setItem('offlineSyncQueue', JSON.stringify(queue));
            setSyncQueue(queue);
        } catch (error) {
            console.error('Failed to save sync queue', error);
        }
    };

    const addToQueue = async (action) => {
        const newQueue = [...syncQueue, { ...action, id: action.id || Date.now().toString(), timestamp: Date.now() }];
        await saveQueue(newQueue);
        if (isConnected) {
            sync();
        }
    };

    const sync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        const queue = [...syncQueue];
        const remainingQueue = [];

        for (const item of queue) {
            try {
                await processItem(item);
            } catch (error) {
                console.error('Sync failed for item:', item, error);
                // Keep in queue if it's a retryable error, otherwise maybe move to a "failed" list
                // For now, we'll keep it in the queue to retry later
                remainingQueue.push(item);
            }
        }

        await saveQueue(remainingQueue);
        setIsSyncing(false);
    };

    const processItem = async (item) => {
        switch (item.type) {
            // Animal Operations
            case 'CREATE_ANIMAL':
                await animalService.createAnimal(item.payload);
                break;
            case 'UPDATE_ANIMAL':
                await animalService.updateAnimal(item.resourceId, item.payload);
                break;
            case 'DELETE_ANIMAL':
                await animalService.deleteAnimal(item.resourceId);
                break;

            // Inventory Operations
            case 'ADD_INVENTORY':
                await inventoryService.addInventoryItem(item.payload);
                break;
            case 'UPDATE_INVENTORY':
                await inventoryService.updateInventoryItem(item.resourceId, item.payload);
                break;
            case 'DELETE_INVENTORY':
                await inventoryService.deleteInventoryItem(item.resourceId);
                break;

            // Treatment Operations
            case 'CREATE_TREATMENT':
                await import('../services/treatmentService').then(module =>
                    module.requestTreatment(item.payload)
                );
                break;

            // MRL Operations
            case 'SUBMIT_LAB_TEST':
                await import('../services/mrlService').then(module =>
                    module.submitLabTest(item.payload)
                );
                break;

            // Feed Operations
            case 'ADD_FEED':
                await import('../services/feedService').then(module =>
                    module.addFeedItem(item.payload)
                );
                break;
            case 'UPDATE_FEED':
                await import('../services/feedService').then(module =>
                    module.updateFeedItem(item.resourceId, item.payload)
                );
                break;
            case 'DELETE_FEED':
                await import('../services/feedService').then(module =>
                    module.deleteFeedItem(item.resourceId)
                );
                break;

            // Feed Administration Operations
            case 'RECORD_FEED_ADMIN':
                await import('../services/feedAdministrationService').then(module =>
                    module.recordFeedAdministration(item.payload)
                );
                break;

            // Sales Operations
            case 'ADD_SALE':
                await import('../services/salesService').then(module =>
                    module.addSale(item.payload)
                );
                break;

            // Ticket Operations
            case 'CREATE_TICKET':
                await import('../services/ticketService').then(module =>
                    module.createTicket(item.payload)
                );
                break;

            // Vet Treatment Operations
            case 'APPROVE_TREATMENT':
                await import('../services/treatmentService').then(module =>
                    module.approveTreatment(item.payload.id, item.payload.data)
                );
                break;

            case 'REJECT_TREATMENT':
                await import('../services/treatmentService').then(module =>
                    module.rejectTreatment(item.payload.id, item.payload.reason)
                );
                break;

            // Feed Administration Operations
            // Feed Administration Operations
            case 'APPROVE_FEED':
                await vetService.approveFeedAdministration(item.payload.id, item.payload.notes);
                break;

            case 'REJECT_FEED':
                await vetService.rejectFeedAdministration(item.payload.id, item.payload.reason);
                break;

            default:
                console.warn('Unknown sync item type:', item.type);
        }
    };

    return (
        <SyncContext.Provider value={{ syncQueue, addToQueue, isSyncing, sync }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => useContext(SyncContext);
