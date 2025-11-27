import {
    generateVetKeys,
    signTreatmentApproval,
    verifyTreatmentSignature,
    generateKeysForAllVets,
} from '../services/digitalSignature.service.js';
import {
    generateFarmMerkleSnapshot,
    batchVerifyEntities,
    verifyFarmWithMerkle,
    generateAndAnchorFarmSnapshot,
} from '../services/merkleTree.service.js';

// @desc    Generate crypto keys for a vet
// @route   POST /api/audit/generate-vet-keys
// @access  Private (Vet)
export const generateVetCryptoKeys = async (req, res) => {
    try {
        const keys = await generateVetKeys(req.user._id);

        res.json({
            success: true,
            message: 'Crypto keys generated successfully',
            publicKey: keys.publicKey,
            // Never send private key in response in production!
        });
    } catch (error) {
        console.error('Error generating vet keys:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Generate keys for all vets (Admin only)
// @route   POST /api/audit/generate-all-vet-keys
// @access  Private (Admin)
export const generateAllVetKeys = async (req, res) => {
    try {
        const result = await generateKeysForAllVets();

        res.json({
            success: true,
            message: `Generated keys for ${result.count} veterinarians`,
            count: result.count,
        });
    } catch (error) {
        console.error('Error generating all vet keys:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Verify treatment signature
// @route   POST /api/audit/verify-signature
// @access  Private
export const verifySignature = async (req, res) => {
    try {
        const { treatmentId, signature, vetId } = req.body;

        const Treatment = (await import('../models/treatment.model.js')).default;
        const treatment = await Treatment.findById(treatmentId);

        if (!treatment) {
            return res.status(404).json({ message: 'Treatment not found' });
        }

        const isValid = await verifyTreatmentSignature(treatment, signature, vetId);

        res.json({
            success: true,
            isValid,
            message: isValid ? 'Signature is valid' : 'Signature is invalid',
        });
    } catch (error) {
        console.error('Error verifying signature:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Generate Merkle snapshot for a farm
// @route   GET /api/audit/merkle-snapshot/:farmerId
// @access  Private (Regulator, Admin, or own farm)
export const getFarmMerkleSnapshot = async (req, res) => {
    try {
        const { farmerId } = req.params;

        // Authorization check
        const userRole = req.user.role.toLowerCase();
        const isAuthorized =
            userRole === 'regulator' ||
            userRole === 'admin' ||
            req.user._id.toString() === farmerId;

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const snapshot = await generateFarmMerkleSnapshot(farmerId);

        res.json({
            success: true,
            snapshot,
        });
    } catch (error) {
        console.error('Error generating Merkle snapshot:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Batch verify multiple entities
// @route   POST /api/audit/batch-verify
// @access  Private (Regulator, Admin)
export const batchVerify = async (req, res) => {
    try {
        const userRole = req.user.role.toLowerCase();
        if (userRole !== 'regulator' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { entities } = req.body;

        if (!entities || !Array.isArray(entities)) {
            return res.status(400).json({ message: 'Invalid entities array' });
        }

        const result = await batchVerifyEntities(entities);

        res.json({
            success: true,
            verification: result,
        });
    } catch (error) {
        console.error('Error in batch verification:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Verify farm with Merkle tree
// @route   GET /api/audit/verify-merkle/:farmerId
// @access  Private (Regulator, Admin, or own farm)
export const verifyFarmMerkle = async (req, res) => {
    try {
        const { farmerId } = req.params;

        // Authorization check
        const userRole = req.user.role.toLowerCase();
        const isAuthorized =
            userRole === 'regulator' ||
            userRole === 'admin' ||
            req.user._id.toString() === farmerId;

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const verification = await verifyFarmWithMerkle(farmerId);

        res.json({
            success: true,
            verification,
        });
    } catch (error) {
        console.error('Error verifying farm with Merkle:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Anchor farm Merkle root to blockchain
// @route   POST /api/audit/anchor-farm/:farmerId
// @access  Private (Farmer, Admin)
export const anchorFarmToBlockchain = async (req, res) => {
    try {
        const { farmerId } = req.params;

        // Authorization check
        const userRole = req.user.role.toLowerCase();
        const isAuthorized =
            userRole === 'admin' ||
            req.user._id.toString() === farmerId;

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const result = await generateAndAnchorFarmSnapshot(farmerId);

        res.json({
            success: true,
            message: result.blockchain ? 'Farm data anchored to blockchain' : 'Snapshot generated (blockchain not configured)',
            data: result
        });
    } catch (error) {
        console.error('Error anchoring farm to blockchain:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

