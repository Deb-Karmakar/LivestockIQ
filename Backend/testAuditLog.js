// Test script for Immutable Audit Log System
// Run this with: node testAuditLog.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createAuditLog, getAuditTrail, verifyIntegrity } from './services/auditLog.service.js';
import { verifyHashChain } from './utils/crypto.utils.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected for Testing');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Test 1: Create audit logs and verify hash chain
const testAuditLogCreation = async () => {
    console.log('\n=== TEST 1: Audit Log Creation ===');

    const testFarmerId = new mongoose.Types.ObjectId();
    const testAnimalId = new mongoose.Types.ObjectId();

    try {
        // Create first audit log (genesis)
        const log1 = await createAuditLog({
            eventType: 'CREATE',
            entityType: 'Animal',
            entityId: testAnimalId,
            farmerId: testFarmerId,
            performedBy: testFarmerId,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: {
                tagId: 'TEST001',
                species: 'Cattle',
                name: 'Test Cow',
            },
        });

        console.log('✅ Created first audit log');
        console.log(`   Hash: ${log1.currentHash.substring(0, 16)}...`);
        console.log(`   Previous Hash: ${log1.previousHash}`);

        // Create second audit log (should chain to first)
        const log2 = await createAuditLog({
            eventType: 'UPDATE',
            entityType: 'Animal',
            entityId: testAnimalId,
            farmerId: testFarmerId,
            performedBy: testFarmerId,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: {
                tagId: 'TEST001',
                species: 'Cattle',
                name: 'Test Cow Updated',
            },
            changes: {
                name: { from: 'Test Cow', to: 'Test Cow Updated' },
            },
        });

        console.log('✅ Created second audit log');
        console.log(`   Hash: ${log2.currentHash.substring(0, 16)}...`);
        console.log(`   Previous Hash: ${log2.previousHash.substring(0, 16)}...`);
        console.log(`   Chain verified: ${log2.previousHash === log1.currentHash ? '✅ YES' : '❌ NO'}`);

        return { testAnimalId, testFarmerId };
    } catch (error) {
        console.error('❌ Test 1 Failed:', error.message);
        throw error;

        // Test 3: Verify hash chain integrity
        const testIntegrityVerification = async (entityId) => {
            console.log('\n=== TEST 3: Hash Chain Integrity Verification ===');

            try {
                const verificationResult = await verifyIntegrity('Animal', entityId);

                console.log(`✅ Verification completed`);
                console.log(`   Is Valid: ${verificationResult.isValid ? '✅ YES' : '❌ NO'}`);
                console.log(`   Total Logs: ${verificationResult.totalLogs}`);
                console.log(`   Message: ${verificationResult.message}`);

                if (!verificationResult.isValid) {
                    console.log(`   ⚠️  Broken at index: ${verificationResult.brokenAt}`);
                }

                return verificationResult;
            } catch (error) {
                console.error('❌ Test 3 Failed:', error.message);
                throw error;
            }
        };

        // Test 4: Tamper detection
        const testTamperDetection = async (auditTrail) => {
            console.log('\n=== TEST 4: Tamper Detection ===');

            try {
                // Simulate tampering by modifying a data snapshot
                const tamperedTrail = JSON.parse(JSON.stringify(auditTrail));
                if (tamperedTrail.length > 0) {
                    tamperedTrail[0].dataSnapshot.name = 'TAMPERED DATA';

                    const verificationResult = verifyHashChain(tamperedTrail);

                    console.log(`✅ Tamper detection test completed`);
                    console.log(`   Tampering detected: ${!verificationResult.isValid ? '✅ YES' : '❌ NO'}`);
                    console.log(`   Message: ${verificationResult.message}`);
                }
            } catch (error) {
                console.error('❌ Test 4 Failed:', error.message);
                throw error;
            }
        };

        // Run all tests
        const runTests = async () => {
            console.log('\n🚀 Starting Audit Log System Tests\n');
            console.log('='.repeat(50));

            try {
                await connectDB();

                const { testAnimalId } = await testAuditLogCreation();
                const auditTrail = await testAuditTrailRetrieval(testAnimalId);
                await testIntegrityVerification(testAnimalId);
                await testTamperDetection(auditTrail);

                console.log('\n' + '='.repeat(50));
                console.log('\n✅ ALL TESTS PASSED!\n');

            } catch (error) {
                console.log('\n' + '='.repeat(50));
                console.log('\n❌ TESTS FAILED\n');
                console.error(error);
            } finally {
                await mongoose.connection.close();
                console.log('✅ Database connection closed');
                process.exit(0);
            }
        };

        runTests();
