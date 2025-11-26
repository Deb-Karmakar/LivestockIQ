// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AuditAnchor
 * @dev Smart contract to anchor Merkle roots of audit logs on Polygon Amoy
 */
contract AuditAnchor {
    struct Snapshot {
        bytes32 merkleRoot;      // Merkle root of all audit logs
        uint256 timestamp;       // When this was anchored
        uint256 logCount;        // Number of logs in this snapshot
        string farmerId;         // Farm ID this snapshot belongs to
    }
    
    // Array of all snapshots
    Snapshot[] public snapshots;
    
    // Mapping from farmerId to their snapshot IDs
    mapping(string => uint256[]) public farmSnapshots;
    
    // Events
    event SnapshotAnchored(
        uint256 indexed id,
        bytes32 merkleRoot,
        string farmerId,
        uint256 logCount,
        uint256 timestamp
    );
    
    /**
     * @dev Anchor a new Merkle root snapshot
     * @param _merkleRoot The Merkle root hash
     * @param _farmerId The farm ID
     * @param _logCount Number of logs in this snapshot
     * @return The snapshot ID
     */
    function anchorSnapshot(
        bytes32 _merkleRoot,
        string memory _farmerId,
        uint256 _logCount
    ) external returns (uint256) {
        uint256 id = snapshots.length;
        
        snapshots.push(Snapshot({
            merkleRoot: _merkleRoot,
            timestamp: block.timestamp,
            logCount: _logCount,
            farmerId: _farmerId
        }));
        
        farmSnapshots[_farmerId].push(id);
        
        emit SnapshotAnchored(id, _merkleRoot, _farmerId, _logCount, block.timestamp);
        
        return id;
    }
    
    /**
     * @dev Get a specific snapshot by ID
     * @param _id The snapshot ID
     * @return The snapshot data
     */
    function getSnapshot(uint256 _id) external view returns (Snapshot memory) {
        require(_id < snapshots.length, "Invalid snapshot ID");
        return snapshots[_id];
    }
    
    /**
     * @dev Get all snapshot IDs for a farm
     * @param _farmerId The farm ID
     * @return Array of snapshot IDs
     */
    function getFarmSnapshots(string memory _farmerId) external view returns (uint256[] memory) {
        return farmSnapshots[_farmerId];
    }
    
    /**
     * @dev Get total number of snapshots
     * @return Total count
     */
    function getSnapshotCount() external view returns (uint256) {
        return snapshots.length;
    }
    
    /**
     * @dev Verify if a Merkle root exists for a farm
     * @param _farmerId The farm ID
     * @param _merkleRoot The Merkle root to verify
     * @return True if exists
     */
    function verifyMerkleRoot(string memory _farmerId, bytes32 _merkleRoot) external view returns (bool) {
        uint256[] memory ids = farmSnapshots[_farmerId];
        for (uint256 i = 0; i < ids.length; i++) {
            if (snapshots[ids[i]].merkleRoot == _merkleRoot) {
                return true;
            }
        }
        return false;
    }
}
