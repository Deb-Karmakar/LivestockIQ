import Veterinarian from '../models/vet.model.js';
import { generateKeyPair } from '../utils/crypto.utils.js';
import { createSignedAuditLog } from '../services/auditLog.service.js';

/**
 * Generate RSA key pair for a veterinarian
 * @param {ObjectId} vetId - Veterinarian ID
 * @returns {Object} - { publicKey, privateKey }
 */
export const generateVetKeys = async (vetId) => {
    try {
        const vet = await Veterinarian.findById(vetId);
        if (!vet) {
            throw new Error('Veterinarian not found');
        }

        // Check if keys already exist
        if (vet.cryptoKeys && vet.cryptoKeys.publicKey) {
            console.log(`⚠️  Vet ${vet.fullName} already has keys`);
            return {
                publicKey: vet.cryptoKeys.publicKey,
                privateKey: vet.cryptoKeys.privateKey,
            };
        }

        // Generate new RSA key pair
        const { publicKey, privateKey } = generateKeyPair();

        // Store keys in database
        vet.cryptoKeys = {
            publicKey,
            privateKey, // In production, encrypt this!
            keyGeneratedAt: new Date(),
        };

        await vet.save();

        console.log(`✅ Generated crypto keys for vet: ${vet.fullName}`);

        return { publicKey, privateKey };
    } catch (error) {
        console.error('Error generating vet keys:', error);
        throw error;
    }
};

/**
 * Get veterinarian's public key
 * @param {ObjectId} vetId - Veterinarian ID
 * @returns {String} - Public key
 */
export const getVetPublicKey = async (vetId) => {
    try {
        const vet = await Veterinarian.findById(vetId).select('cryptoKeys.publicKey');

        if (!vet || !vet.cryptoKeys || !vet.cryptoKeys.publicKey) {
            throw new Error('Vet does not have a public key. Generate keys first.');
        }

        return vet.cryptoKeys.publicKey;
    } catch (error) {
        console.error('Error getting vet public key:', error);
        throw error;
    }
};

/**
 * Get veterinarian's private key (use with caution!)
 * @param {ObjectId} vetId - Veterinarian ID
 * @returns {String} - Private key
 */
export const getVetPrivateKey = async (vetId) => {
    try {
        const vet = await Veterinarian.findById(vetId).select('cryptoKeys.privateKey');

        if (!vet || !vet.cryptoKeys || !vet.cryptoKeys.privateKey) {
            throw new Error('Vet does not have a private key. Generate keys first.');
        }

        return vet.cryptoKeys.privateKey;
    } catch (error) {
        console.error('Error getting vet private key:', error);
        throw error;
    }
};

/**
 * Sign treatment approval with vet's private key
 * @param {Object} treatmentData - Treatment data to sign
 * @param {ObjectId} vetId - Veterinarian ID
 * @returns {String} - Digital signature
 */
export const signTreatmentApproval = async (treatmentData, vetId) => {
    try {
        const { signData } = await import('../utils/crypto.utils.js');

        // Get vet's private key
        const privateKey = await getVetPrivateKey(vetId);

        // Create signature data
        const dataToSign = {
            treatmentId: treatmentData._id,
            animalId: treatmentData.animalId,
            drugName: treatmentData.drugName,
            status: treatmentData.status,
            approvedAt: new Date(),
            vetId: vetId,
        };

        // Sign the data
        const signature = signData(dataToSign, privateKey);

        console.log(`✅ Treatment approval signed by vet ${vetId}`);

        return signature;
    } catch (error) {
        console.error('Error signing treatment approval:', error);
        throw error;
    }
};

/**
 * Verify treatment approval signature
 * @param {Object} treatmentData - Treatment data
 * @param {String} signature - Digital signature
 * @param {ObjectId} vetId - Veterinarian ID
 * @returns {Boolean} - True if signature is valid
 */
export const verifyTreatmentSignature = async (treatmentData, signature, vetId) => {
    try {
        const { verifySignature } = await import('../utils/crypto.utils.js');

        // Get vet's public key
        const publicKey = await getVetPublicKey(vetId);

        // Reconstruct the signed data
        const dataToVerify = {
            treatmentId: treatmentData._id,
            animalId: treatmentData.animalId,
            drugName: treatmentData.drugName,
            status: treatmentData.status,
            approvedAt: treatmentData.approvedAt || new Date(),
            vetId: vetId,
        };

        // Verify the signature
        const isValid = verifySignature(dataToVerify, signature, publicKey);

        console.log(`${isValid ? '✅' : '❌'} Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);

        return isValid;
    } catch (error) {
        console.error('Error verifying treatment signature:', error);
        return false;
    }
};

/**
 * Generate keys for all vets who don't have them
 * Useful for migrating existing vets
 */
export const generateKeysForAllVets = async () => {
    try {
        const vets = await Veterinarian.find({
            $or: [
                { 'cryptoKeys.publicKey': { $exists: false } },
                { 'cryptoKeys.publicKey': null },
            ],
        });

        console.log(`Found ${vets.length} vets without crypto keys`);

        for (const vet of vets) {
            await generateVetKeys(vet._id);
        }

        console.log(`✅ Generated keys for ${vets.length} veterinarians`);

        return { count: vets.length };
    } catch (error) {
        console.error('Error generating keys for all vets:', error);
        throw error;
    }
};
