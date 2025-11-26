import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    generateVetCryptoKeys,
    generateAllVetKeys,
    verifySignature,
    getFarmMerkleSnapshot,
    batchVerify,
    verifyFarmMerkle,
    anchorFarmToBlockchain,
} from '../controllers/auditEnhancements.controller.js';

const router = express.Router();

// Generate crypto keys for logged-in vet
router.post('/generate-vet-keys', protect, generateVetCryptoKeys);

// Generate keys for all vets (Admin only)
router.post('/generate-all-vet-keys', protect, generateAllVetKeys);

// Verify a treatment signature
router.post('/verify-signature', protect, verifySignature);

// Get Merkle snapshot for a farm
router.get('/merkle-snapshot/:farmerId', protect, getFarmMerkleSnapshot);

// Batch verify multiple entities (Regulator/Admin only)
router.post('/batch-verify', protect, batchVerify);

// Verify farm with Merkle tree
router.get('/verify-merkle/:farmerId', protect, verifyFarmMerkle);

// Anchor farm Merkle root to blockchain
router.post('/anchor-farm/:farmerId', protect, anchorFarmToBlockchain);

export default router;

