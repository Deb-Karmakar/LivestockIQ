import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI
const loadContractABI = () => {
    try {
        const artifactPath = path.join(__dirname, '../artifacts/contracts/AuditAnchor.sol/AuditAnchor.json');
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return artifact.abi;
    } catch (error) {
        console.error('❌ Failed to load contract ABI:', error.message);
        console.log('💡 Make sure to compile the contract first: npx hardhat compile');
        return null;
    }
};

// Initialize provider and contract
let provider, wallet, contract;

const initializeBlockchain = () => {
    try {
        if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
            console.warn('⚠️  BLOCKCHAIN_PRIVATE_KEY not set. Blockchain features disabled.');
            return false;
        }

        if (!process.env.AUDIT_ANCHOR_ADDRESS) {
            console.warn('⚠️  AUDIT_ANCHOR_ADDRESS not set. Deploy contract first.');
            return false;
        }

        const abi = loadContractABI();
        if (!abi) return false;

        provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');
        wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
        contract = new ethers.Contract(process.env.AUDIT_ANCHOR_ADDRESS, abi, wallet);

        console.log('✅ Blockchain service initialized');
        console.log(`📍 Contract: ${process.env.AUDIT_ANCHOR_ADDRESS}`);
        return true;
    } catch (error) {
        console.error('❌ Blockchain initialization failed:', error.message);
        return false;
    }
};

/**
 * Anchor a Merkle root to the blockchain
 * @param {string} merkleRoot - The Merkle root hash (hex string)
 * @param {string} farmerId - The farm ID
 * @param {number} logCount - Number of logs in this snapshot
 * @returns {Object} Transaction details
 */
export const anchorMerkleRoot = async (merkleRoot, farmerId, logCount) => {
    try {
        if (!contract) {
            const initialized = initializeBlockchain();
            if (!initialized) {
                throw new Error('Blockchain not initialized');
            }
        }

        console.log(`📡 Anchoring Merkle root to Polygon Amoy...`);
        console.log(`   Farm: ${farmerId}`);
        console.log(`   Root: ${merkleRoot.substring(0, 16)}...`);
        console.log(`   Logs: ${logCount}`);

        // Convert hex string to bytes32 if needed
        const rootBytes32 = merkleRoot.startsWith('0x') ? merkleRoot : `0x${merkleRoot}`;

        // Send transaction
        const tx = await contract.anchorSnapshot(rootBytes32, farmerId.toString(), logCount);
        console.log(`⏳ Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Confirmed in block ${receipt.blockNumber}`);

        // Extract snapshot ID from event
        const event = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'SnapshotAnchored';
            } catch {
                return false;
            }
        });

        let snapshotId = null;
        if (event) {
            const parsed = contract.interface.parseLog(event);
            snapshotId = parsed.args.id.toString();
        }

        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            snapshotId: snapshotId,
            explorerUrl: `https://amoy.polygonscan.com/tx/${receipt.hash}`
        };
    } catch (error) {
        console.error('❌ Blockchain anchoring failed:', error.message);
        throw error;
    }
};

/**
 * Get a snapshot from the blockchain
 * @param {number} snapshotId - The snapshot ID
 * @returns {Object} Snapshot data
 */
export const getBlockchainSnapshot = async (snapshotId) => {
    try {
        if (!contract) {
            const initialized = initializeBlockchain();
            if (!initialized) {
                throw new Error('Blockchain not initialized');
            }
        }

        const snapshot = await contract.getSnapshot(snapshotId);

        return {
            merkleRoot: snapshot.merkleRoot,
            timestamp: new Date(Number(snapshot.timestamp) * 1000),
            logCount: Number(snapshot.logCount),
            farmerId: snapshot.farmerId
        };
    } catch (error) {
        console.error('❌ Failed to get blockchain snapshot:', error.message);
        throw error;
    }
};

/**
 * Get all snapshots for a farm
 * @param {string} farmerId - The farm ID
 * @returns {Array} Array of snapshot IDs
 */
export const getFarmSnapshots = async (farmerId) => {
    try {
        if (!contract) {
            const initialized = initializeBlockchain();
            if (!initialized) {
                throw new Error('Blockchain not initialized');
            }
        }

        const snapshotIds = await contract.getFarmSnapshots(farmerId.toString());
        return snapshotIds.map(id => Number(id));
    } catch (error) {
        console.error('❌ Failed to get farm snapshots:', error.message);
        throw error;
    }
};

/**
 * Verify if a Merkle root exists on the blockchain
 * @param {string} farmerId - The farm ID
 * @param {string} merkleRoot - The Merkle root to verify
 * @returns {boolean} True if exists
 */
export const verifyMerkleRootOnChain = async (farmerId, merkleRoot) => {
    try {
        if (!contract) {
            const initialized = initializeBlockchain();
            if (!initialized) {
                throw new Error('Blockchain not initialized');
            }
        }

        const rootBytes32 = merkleRoot.startsWith('0x') ? merkleRoot : `0x${merkleRoot}`;
        const exists = await contract.verifyMerkleRoot(farmerId.toString(), rootBytes32);

        return exists;
    } catch (error) {
        console.error('❌ Failed to verify Merkle root:', error.message);
        throw error;
    }
};

/**
 * Anchor a lab test to the blockchain
 * @param {Object} labTestData - Lab test data to anchor
 * @returns {Object} Transaction details
 */
export const anchorLabTest = async (labTestData) => {
    try {
        if (!contract) {
            const initialized = initializeBlockchain();
            if (!initialized) {
                throw new Error('Blockchain not initialized');
            }
        }

        const crypto = await import('crypto');

        // Create a deterministic hash of the lab test data
        const testDataString = JSON.stringify({
            testId: labTestData._id.toString(),
            animalId: labTestData.animalId,
            drugName: labTestData.drugName,
            sampleType: labTestData.sampleType,
            productType: labTestData.productType,
            residueLevelDetected: labTestData.residueLevelDetected,
            unit: labTestData.unit,
            mrlThreshold: labTestData.mrlThreshold,
            testDate: labTestData.testDate,
            labName: labTestData.labName,
            testReportNumber: labTestData.testReportNumber,
            isPassed: labTestData.isPassed,
            testedBy: labTestData.testedBy,
        });

        const labTestHash = crypto.createHash('sha256').update(testDataString).digest('hex');
        const hashBytes32 = `0x${labTestHash}`;

        console.log(`📡 Anchoring Lab Test to Polygon Amoy...`);
        console.log(`   Test ID: ${labTestData._id}`);
        console.log(`   Animal: ${labTestData.animalId}`);
        console.log(`   Drug: ${labTestData.drugName}`);
        console.log(`   Hash: ${labTestHash.substring(0, 16)}...`);

        // Anchor to blockchain using the same contract method
        // We'll use anchorSnapshot with a single "log" (the lab test)
        const tx = await contract.anchorSnapshot(
            hashBytes32,
            labTestData.farmerId.toString(),
            1 // logCount = 1 for a single lab test
        );

        console.log(`⏳ Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Confirmed in block ${receipt.blockNumber}`);

        // Extract snapshot ID from event
        const event = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'SnapshotAnchored';
            } catch {
                return false;
            }
        });

        let snapshotId = null;
        if (event) {
            const parsed = contract.interface.parseLog(event);
            snapshotId = parsed.args.id.toString();
        }

        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            snapshotId: snapshotId,
            labTestHash: labTestHash,
            explorerUrl: `https://amoy.polygonscan.com/tx/${receipt.hash}`
        };
    } catch (error) {
        console.error('❌ Lab test blockchain anchoring failed:', error.message);
        throw error;
    }
};

// Initialize on module load
initializeBlockchain();
