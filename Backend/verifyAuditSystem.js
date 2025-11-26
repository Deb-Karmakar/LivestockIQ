// Quick verification script - tests audit logging with real API calls
// This simulates what happens when you use the frontend

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// You'll need to replace these with real credentials from your database
const TEST_CREDENTIALS = {
    email: 'farmer@test.com',  // Replace with a real farmer email
    password: 'password123'     // Replace with real password
};

let authToken = '';

// Step 1: Login
async function login() {
    console.log('\n📝 Step 1: Logging in as farmer...');
    try {
        const response = await axios.post(`${API_URL}/auth/login`, TEST_CREDENTIALS);
        authToken = response.data.token;
        console.log('✅ Login successful!');
        return response.data.user;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

// Step 2: Create an animal
async function createAnimal() {
    console.log('\n📝 Step 2: Creating a test animal...');
    try {
        const animalData = {
            tagId: `TEST${Date.now()}`, // Unique tag ID
            name: 'Audit Test Cow',
            species: 'Cattle',
            gender: 'Female',
            weight: '500 kg',
            dob: '2023-01-15'
        };

        const response = await axios.post(`${API_URL}/animals`, animalData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Animal created successfully!');
        console.log(`   Animal ID: ${response.data._id}`);
        console.log(`   Tag ID: ${response.data.tagId}`);
        return response.data;
    } catch (error) {
        console.error('❌ Animal creation failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

// Step 3: Get audit trail for the animal
async function getAuditTrail(animalId) {
    console.log('\n📝 Step 3: Fetching audit trail...');
    try {
        const response = await axios.get(`${API_URL}/audit/trail/Animal/${animalId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Audit trail retrieved!');
        console.log(`   Total audit logs: ${response.data.count}`);

        response.data.data.forEach((log, index) => {
            console.log(`\n   Audit Log #${index + 1}:`);
            console.log(`   - Event: ${log.eventType}`);
            console.log(`   - Timestamp: ${new Date(log.timestamp).toLocaleString()}`);
            console.log(`   - Hash: ${log.currentHash.substring(0, 16)}...`);
            console.log(`   - Previous Hash: ${log.previousHash.substring(0, 16)}...`);
        });

        return response.data.data;
    } catch (error) {
        console.error('❌ Failed to get audit trail:', error.response?.data?.message || error.message);
        throw error;
    }
}

// Step 4: Update the animal
async function updateAnimal(animalId) {
    console.log('\n📝 Step 4: Updating the animal...');
    try {
        const updateData = {
            name: 'Audit Test Cow - UPDATED',
            weight: '550 kg'
        };

        const response = await axios.put(`${API_URL}/animals/${animalId}`, updateData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Animal updated successfully!');
        return response.data;
    } catch (error) {
        console.error('❌ Animal update failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

// Step 5: Verify integrity
async function verifyIntegrity(animalId) {
    console.log('\n📝 Step 5: Verifying audit trail integrity...');
    try {
        const response = await axios.get(`${API_URL}/audit/verify/Animal/${animalId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const verification = response.data.verification;

        console.log('✅ Verification completed!');
        console.log(`   Is Valid: ${verification.isValid ? '✅ YES' : '❌ NO'}`);
        console.log(`   Total Logs: ${verification.totalLogs}`);
        console.log(`   Message: ${verification.message}`);

        if (!verification.isValid) {
            console.log(`   ⚠️  Chain broken at: ${verification.brokenAt}`);
        }

        return verification;
    } catch (error) {
        console.error('❌ Verification failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

// Step 6: Get all your audit logs
async function getMyAuditLogs() {
    console.log('\n📝 Step 6: Fetching all your audit logs...');
    try {
        const response = await axios.get(`${API_URL}/audit/my-logs?limit=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Retrieved your audit logs!');
        console.log(`   Total logs: ${response.data.count}`);

        const eventCounts = {};
        response.data.data.forEach(log => {
            eventCounts[log.eventType] = (eventCounts[log.eventType] || 0) + 1;
        });

        console.log('\n   Event Summary:');
        Object.entries(eventCounts).forEach(([event, count]) => {
            console.log(`   - ${event}: ${count}`);
        });

        return response.data.data;
    } catch (error) {
        console.error('❌ Failed to get audit logs:', error.response?.data?.message || error.message);
        throw error;
    }
}

// Run all verification steps
async function runVerification() {
    console.log('\n🚀 Starting Audit Log Verification\n');
    console.log('='.repeat(60));

    try {
        const user = await login();
        const animal = await createAnimal();
        await getAuditTrail(animal._id);
        await updateAnimal(animal._id);
        await getAuditTrail(animal._id); // Should show 2 logs now
        await verifyIntegrity(animal._id);
        await getMyAuditLogs();

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ALL VERIFICATION STEPS PASSED!\n');
        console.log('🎉 Your audit logging system is working perfectly!\n');

    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.log('\n❌ VERIFICATION FAILED\n');
        console.error(error);
    }
}

runVerification();
