import crypto from 'crypto';

/**
 * Generate SHA-256 hash from data
 * @param {Object|String} data - Data to hash
 * @returns {String} - Hex string of hash
 */
export const generateHash = (data) => {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Generate a hash chain entry
 * Combines previous hash with current data to create tamper-proof chain
 * @param {String} previousHash - Hash of the previous entry in the chain
 * @param {Object} currentData - Current audit log data
 * @returns {String} - Hash for current entry
 */
export const generateChainHash = (previousHash, currentData) => {
    const chainData = {
        previousHash: previousHash || '0', // Genesis block uses '0'
        timestamp: currentData.timestamp,
        entityId: currentData.entityId,
        entityType: currentData.entityType,
        eventType: currentData.eventType,
        dataSnapshot: currentData.dataSnapshot,
    };
    return generateHash(chainData);
};

/**
 * Generate RSA key pair for digital signatures
 * @returns {Object} - { publicKey, privateKey }
 */
export const generateKeyPair = () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });
    return { publicKey, privateKey };
};

/**
 * Sign data with private key
 * @param {Object} data - Data to sign
 * @param {String} privateKey - PEM formatted private key
 * @returns {String} - Base64 encoded signature
 */
export const signData = (data, privateKey) => {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const sign = crypto.createSign('SHA256');
    sign.update(dataString);
    sign.end();
    return sign.sign(privateKey, 'base64');
};

/**
 * Verify signature with public key
 * @param {Object} data - Original data that was signed
 * @param {String} signature - Base64 encoded signature
 * @param {String} publicKey - PEM formatted public key
 * @returns {Boolean} - True if signature is valid
 */
export const verifySignature = (data, signature, publicKey) => {
    try {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        const verify = crypto.createVerify('SHA256');
        verify.update(dataString);
        verify.end();
        return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
};

/**
 * Generate Merkle root from array of hashes
 * Useful for batch verification of multiple audit entries
 * @param {Array<String>} hashes - Array of hash strings
 * @returns {String} - Merkle root hash
 */
export const generateMerkleRoot = (hashes) => {
    if (!hashes || hashes.length === 0) {
        return generateHash('');
    }
    
    if (hashes.length === 1) {
        return hashes[0];
    }
    
    const newLevel = [];
    for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
            // Pair exists
            newLevel.push(generateHash(hashes[i] + hashes[i + 1]));
        } else {
            // Odd number, hash with itself
            newLevel.push(generateHash(hashes[i] + hashes[i]));
        }
    }
    
    return generateMerkleRoot(newLevel);
};

/**
 * Verify hash chain integrity for a sequence of audit logs
 * @param {Array<Object>} auditLogs - Array of audit log entries (sorted by timestamp)
 * @returns {Object} - { isValid: Boolean, brokenAt: Number|null, message: String }
 */
export const verifyHashChain = (auditLogs) => {
    if (!auditLogs || auditLogs.length === 0) {
        return { isValid: true, brokenAt: null, message: 'No audit logs to verify' };
    }
    
    for (let i = 0; i < auditLogs.length; i++) {
        const log = auditLogs[i];
        const expectedPreviousHash = i === 0 ? '0' : auditLogs[i - 1].currentHash;
        
        // Verify previous hash matches
        if (log.previousHash !== expectedPreviousHash) {
            return {
                isValid: false,
                brokenAt: i,
                message: `Hash chain broken at index ${i}: previousHash mismatch`,
            };
        }
        
        // Verify current hash is correct
        const computedHash = generateChainHash(log.previousHash, {
            timestamp: log.timestamp,
            entityId: log.entityId,
            entityType: log.entityType,
            eventType: log.eventType,
            dataSnapshot: log.dataSnapshot,
        });
        
        if (log.currentHash !== computedHash) {
            return {
                isValid: false,
                brokenAt: i,
                message: `Hash chain broken at index ${i}: currentHash has been tampered with`,
            };
        }
    }
    
    return {
        isValid: true,
        brokenAt: null,
        message: 'Hash chain integrity verified successfully',
    };
};
