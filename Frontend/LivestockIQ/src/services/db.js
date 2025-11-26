import Dexie from 'dexie';

export const db = new Dexie('LivestockIQDB');

db.version(1).stores({
    farmers: '++id, _id, email, syncStatus', // _id is backend ID, syncStatus: 'synced' | 'created' | 'updated'
    vets: '++id, _id, email, syncStatus',
    animals: '++id, _id, tagId, syncStatus',
    inventory: '++id, _id, itemName, syncStatus',
    treatments: '++id, _id, animalId, syncStatus',
    sales: '++id, _id, animalId, syncStatus',
    amuAlerts: '++id, _id, syncStatus',
    diseaseAlerts: '++id, _id, syncStatus',
    vetDashboard: '++id, _id, syncStatus',
    treatmentRequests: '++id, _id, syncStatus',
    myFarmers: '++id, _id, syncStatus',
    farmerAnimals: '++id, _id, farmerId, syncStatus',
    reports: '++id, _id, syncStatus',
    syncQueue: '++id, collection, operation, data, timestamp' // collection: 'farmers' | 'vets' | 'animals' | 'inventory' | 'treatments' | 'sales' | 'reports', operation: 'create' | 'update'
});

export const addToSyncQueue = async (collection, operation, data) => {
    await db.syncQueue.add({
        collection,
        operation,
        data,
        timestamp: Date.now()
    });
};
