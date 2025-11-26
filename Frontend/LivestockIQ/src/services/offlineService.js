import { db, addToSyncQueue } from './db';

// Farmer Operations
export const saveOfflineFarmer = async (farmerData) => {
    // Add to local store
    const id = await db.farmers.add({
        ...farmerData,
        syncStatus: 'created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Add to sync queue
    await addToSyncQueue('farmers', 'create', { ...farmerData, tempId: id });
    return id;
};

export const updateOfflineFarmer = async (id, updates) => {
    await db.farmers.update(id, {
        ...updates,
        syncStatus: 'updated',
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('farmers', 'update', { id, updates });
};

export const getOfflineFarmers = async () => {
    return await db.farmers.toArray();
};

export const cacheFarmerProfile = async (profile) => {
    await db.transaction('rw', db.farmers, async () => {
        await db.farmers.clear();
        await db.farmers.add({
            ...profile,
            syncStatus: 'synced'
        });
    });
};

// Vet Operations
export const saveOfflineVet = async (vetData) => {
    const id = await db.vets.add({
        ...vetData,
        syncStatus: 'created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('vets', 'create', { ...vetData, tempId: id });
    return id;
};

export const getOfflineVets = async () => {
    return await db.vets.toArray();
};

export const updateOfflineVet = async (id, updates) => {
    await db.vets.update(id, {
        ...updates,
        syncStatus: 'updated',
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('vets', 'update', { id, updates });
};

export const cacheVetProfile = async (profile) => {
    await db.transaction('rw', db.vets, async () => {
        // We assume single user per device, so we can clear or just update the existing one.
        // For simplicity, let's clear and add.
        await db.vets.clear();
        await db.vets.add({
            ...profile,
            syncStatus: 'synced'
        });
    });
};

// Animal Operations
export const saveOfflineAnimal = async (animalData) => {
    const id = await db.animals.add({
        ...animalData,
        syncStatus: 'created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('animals', 'create', { ...animalData, tempId: id });
    return id;
};

export const updateOfflineAnimal = async (id, updates) => {
    await db.animals.update(id, {
        ...updates,
        syncStatus: 'updated',
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('animals', 'update', { id, updates });
};

export const getOfflineAnimals = async () => {
    return await db.animals.toArray();
};

export const cacheAnimals = async (animals) => {
    await db.transaction('rw', db.animals, async () => {
        await db.animals.clear();
        const animalsWithStatus = animals.map(animal => ({
            ...animal,
            syncStatus: 'synced'
        }));
        await db.animals.bulkAdd(animalsWithStatus);
    });
};

// Inventory Operations
export const saveOfflineInventory = async (itemData) => {
    const id = await db.inventory.add({
        ...itemData,
        syncStatus: 'created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('inventory', 'create', { ...itemData, tempId: id });
    return id;
};

export const updateOfflineInventory = async (id, updates) => {
    await db.inventory.update(id, {
        ...updates,
        syncStatus: 'updated',
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('inventory', 'update', { id, updates });
};

export const getOfflineInventory = async () => {
    return await db.inventory.toArray();
};

export const cacheInventory = async (items) => {
    await db.transaction('rw', db.inventory, async () => {
        await db.inventory.clear();
        const itemsWithStatus = items.map(item => ({
            ...item,
            syncStatus: 'synced'
        }));
        await db.inventory.bulkAdd(itemsWithStatus);
    });
};

// Treatment Operations
export const saveOfflineTreatment = async (treatmentData) => {
    const id = await db.treatments.add({
        ...treatmentData,
        syncStatus: 'created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('treatments', 'create', { ...treatmentData, tempId: id });
    return id;
};

export const updateOfflineTreatment = async (id, updates) => {
    await db.treatments.update(id, {
        ...updates,
        syncStatus: 'updated',
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('treatments', 'update', { id, updates });
};

export const getOfflineTreatments = async () => {
    return await db.treatments.toArray();
};

export const cacheTreatments = async (treatments) => {
    await db.transaction('rw', db.treatments, async () => {
        await db.treatments.clear();
        const treatmentsWithStatus = treatments.map(t => ({
            ...t,
            syncStatus: 'synced'
        }));
        await db.treatments.bulkAdd(treatmentsWithStatus);
    });
};

// Sales Operations
export const saveOfflineSale = async (saleData) => {
    const id = await db.sales.add({
        ...saleData,
        syncStatus: 'created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    await addToSyncQueue('sales', 'create', { ...saleData, tempId: id });
    return id;
};

export const getOfflineSales = async () => {
    return await db.sales.toArray();
};

export const cacheSales = async (sales) => {
    await db.transaction('rw', db.sales, async () => {
        await db.sales.clear();
        const salesWithStatus = sales.map(s => ({
            ...s,
            syncStatus: 'synced'
        }));
        await db.sales.bulkAdd(salesWithStatus);
    });
};

// Alert Operations
export const cacheAmuAlerts = async (alerts) => {
    await db.transaction('rw', db.amuAlerts, async () => {
        await db.amuAlerts.clear();
        const alertsWithStatus = alerts.map(a => ({
            ...a,
            syncStatus: 'synced'
        }));
        await db.amuAlerts.bulkAdd(alertsWithStatus);
    });
};

export const getOfflineAmuAlerts = async () => {
    return await db.amuAlerts.toArray();
};

export const cacheDiseaseAlerts = async (alerts) => {
    await db.transaction('rw', db.diseaseAlerts, async () => {
        await db.diseaseAlerts.clear();
        const alertsWithStatus = alerts.map(a => ({
            ...a,
            syncStatus: 'synced'
        }));
        await db.diseaseAlerts.bulkAdd(alertsWithStatus);
    });
};

export const getOfflineDiseaseAlerts = async () => {
    return await db.diseaseAlerts.toArray();
};

// Vet Dashboard Operations
export const cacheVetDashboard = async (data) => {
    await db.transaction('rw', db.vetDashboard, async () => {
        await db.vetDashboard.clear();
        await db.vetDashboard.add({
            ...data,
            syncStatus: 'synced',
            _id: 'dashboard_stats' // Fixed ID for singleton dashboard data
        });
    });
};

export const getOfflineVetDashboard = async () => {
    const data = await db.vetDashboard.toArray();
    return data[0] || null;
};

// Treatment Request Operations
export const cacheTreatmentRequests = async (requests) => {
    await db.transaction('rw', db.treatmentRequests, async () => {
        await db.treatmentRequests.clear();
        const requestsWithStatus = requests.map(r => ({
            ...r,
            syncStatus: 'synced'
        }));
        await db.treatmentRequests.bulkAdd(requestsWithStatus);
    });
};

export const getOfflineTreatmentRequests = async () => {
    return await db.treatmentRequests.toArray();
};

// My Farmers Operations
export const cacheMyFarmers = async (farmers) => {
    await db.transaction('rw', db.myFarmers, async () => {
        await db.myFarmers.clear();
        const farmersWithStatus = farmers.map(f => ({
            ...f,
            syncStatus: 'synced'
        }));
        await db.myFarmers.bulkAdd(farmersWithStatus);
    });
};

export const getOfflineMyFarmers = async () => {
    return await db.myFarmers.toArray();
};

// Farmer Animals Operations
export const cacheFarmerAnimals = async (farmerId, animals) => {
    await db.transaction('rw', db.farmerAnimals, async () => {
        // Remove existing animals for this farmer to avoid duplicates/stale data
        await db.farmerAnimals.where('farmerId').equals(farmerId).delete();

        const animalsWithStatus = animals.map(a => ({
            ...a,
            farmerId, // Ensure farmerId is present for querying
            syncStatus: 'synced'
        }));
        await db.farmerAnimals.bulkAdd(animalsWithStatus);
    });
};

export const getOfflineFarmerAnimals = async (farmerId) => {
    return await db.farmerAnimals.where('farmerId').equals(farmerId).toArray();
};

// Report Operations
export const saveOfflineReport = async (reportData) => {
    const id = await db.reports.add({
        ...reportData,
        syncStatus: 'created',
        createdAt: new Date().toISOString()
    });

    await addToSyncQueue('reports', 'create', { ...reportData, tempId: id });
    return id;
};
