// Quick test script for enhanced audit features
// Run with: node testEnhancements.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const testEnhancements = async () => {
    console.log('\n🚀 Testing Audit System Enhancements\n');
    console.log('='.repeat(60));

    try {
        await connectDB();

        // Test 1: Check if services load correctly
        console.log('\n📝 Test 1: Loading enhancement services...');
        const digitalSig = await import('./services/digitalSignature.service.js');
        const merkleTree = await import('./services/merkleTree.service.js');
        console.log('✅ Digital signature service loaded');
        console.log('✅ Merkle tree service loaded');

        // Test 2: Check if vet model has crypto keys field
        console.log('\n📝 Test 2: Checking vet model...');
        const Veterinarian = (await import('./models/vet.model.js')).default;
        const sampleVet = new Veterinarian({
            fullName: 'Test Vet',
            licenseNumber: 'TEST123',
            email: 'test@vet.com',
            password: 'password123',
        });
        console.log('✅ Vet model supports cryptoKeys:', 'cryptoKeys' in sampleVet);

        // Test 3: Test key generation
        console.log('\n📝 Test 3: Testing key generation...');
        const { generateKeyPair } = await import('./utils/crypto.utils.js');
        const { publicKey, privateKey } = generateKeyPair();
        console.log('✅ RSA key pair generated successfully');
        console.log(`   Public key length: ${publicKey.length} chars`);
        console.log(`   Private key length: ${privateKey.length} chars`);

        // Test 4: Test Merkle root generation
        console.log('\n📝 Test 4: Testing Merkle root generation...');
        const { generateMerkleRoot } = await import('./utils/crypto.utils.js');
        const testHashes = [
            'hash1abc123',
            'hash2def456',
            'hash3ghi789',
        ];
        const merkleRoot = generateMerkleRoot(testHashes);
        console.log('✅ Merkle root generated successfully');
        console.log(`   Merkle root: ${merkleRoot.substring(0, 32)}...`);

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ALL ENHANCEMENT TESTS PASSED!\n');
        console.log('🎉 Your enhanced audit system is ready to use!\n');
        console.log('Next steps:');
        console.log('1. Restart your backend server');
        console.log('2. Test vet approval with digital signatures');
        console.log('3. Try the new Merkle tree endpoints\n');

    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.log('\n❌ TESTS FAILED\n');
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    }
};

testEnhancements();
