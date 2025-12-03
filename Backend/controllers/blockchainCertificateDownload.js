/**
 * Download blockchain verification certificate as PDF
 * @route   GET /api/audit/blockchain-certificate/:logId
 * @access  Private (Regulator, Admin)
 */
export const downloadBlockchainCertificate = async (req, res) => {
    try {
        const { logId } = req.params;

        // Get the audit log
        const log = await AuditLog.findById(logId)
            .populate('performedBy', 'farmOwner fullName email')
            .lean();

        if (!log) {
            return res.status(404).json({ message: 'Audit log not found' });
        }

        // Authorization check - Only regulators and admins can download certificates
        const userRole = req.user.role?.toLowerCase();
        const isAuthorized = userRole === 'regulator' || userRole === 'admin';

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Only regulators and admins can download certificates' });
        }

        // Find blockchain snapshot
        const snapshot = await findBlockchainSnapshotForLog(logId);

        if (!snapshot) {
            return res.status(400).json({
                message: 'Cannot generate certificate - log not yet anchored to blockchain'
            });
        }

        // Prepare log details for PDF
        const logDetails = {
            id: log._id.toString(),
            eventType: log.eventType,
            entityType: log.entityType,
            timestamp: log.timestamp || log.createdAt,
            performedBy: log.performedBy?.farmOwner || log.performedBy?.fullName || log.performedByRole || 'System',
        };

        // Prepare blockchain proof for PDF
        const blockchainProof = {
            transactionHash: snapshot.dataSnapshot.transactionHash,
            blockNumber: snapshot.dataSnapshot.blockNumber,
            merkleRoot: snapshot.dataSnapshot.merkleRoot,
            explorerUrl: snapshot.dataSnapshot.explorerUrl ||
                `https://amoy.polygonscan.com/tx/${snapshot.dataSnapshot.transactionHash}`,
            anchorTimestamp: snapshot.timestamp,
            totalLogsInSnapshot: snapshot.dataSnapshot.totalLogs,
        };

        // Generate PDF certificate
        const pdfBuffer = await generateBlockchainCertificate(logDetails, blockchainProof);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="blockchain-certificate-${logId.substring(0, 8)}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating blockchain certificate:', error);
        res.status(500).json({
            message: 'Failed to generate certificate',
            error: error.message
        });
    }
};
