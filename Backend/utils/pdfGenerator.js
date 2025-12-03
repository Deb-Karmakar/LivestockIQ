import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { format } from 'date-fns';

/**
 * Generate a professional blockchain verification certificate PDF
 * @param {Object} logDetails - Audit log details
 * @param {Object} blockchainProof - Blockchain proof data
 * @returns {Buffer} PDF buffer
 */
export const generateBlockchainCertificate = async (logDetails, blockchainProof) => {
    try {
        // Create new PDF document
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Color palette
        const primaryColor = [30, 41, 59]; // Slate 800
        const accentColor = [59, 130, 246]; // Blue 500
        const successColor = [34, 197, 94]; // Green 500
        const slateText = [100, 100, 100];

        // === HEADER SECTION ===
        const headerHeight = 64;
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');

        // Logo area
        const logoX = 18;
        const logoY = headerHeight / 2 - 6;
        doc.setFillColor(255, 255, 255);
        doc.circle(logoX, logoY, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...accentColor);
        doc.text('LivestockIQ', logoX, logoY + 2, { align: 'center' });

        // Title and subtitle
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('BLOCKCHAIN VERIFICATION', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Certificate of Authenticity', pageWidth / 2, 28, { align: 'center' });

        // Certificate ID
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        const certificateId = logDetails?.id ? logDetails.id.substring(0, 16).toUpperCase() : 'N/A';
        doc.text(`Certificate ID: ${certificateId}`, pageWidth / 2, 36, { align: 'center' });

        // === VERIFIED BADGE ===
        let yPos = headerHeight + 10;
        const badgeWidth = 110;
        const badgeHeight = 18;
        const badgeX = (pageWidth - badgeWidth) / 2;
        const badgeY = yPos;
        doc.setFillColor(...successColor);
        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4, 4, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('VERIFIED ON BLOCKCHAIN', pageWidth / 2, badgeY + badgeHeight / 2 + 3, { align: 'center' });

        yPos = badgeY + badgeHeight + 14;

        // === AUDIT LOG DETAILS SECTION ===
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Audit Record Details', 20, yPos);

        yPos += 4;
        const detailsBoxHeight = 58;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(20, yPos, pageWidth - 40, detailsBoxHeight);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);

        let innerY = yPos + 8;
        const labelX = 25;
        const valueX = 68;

        doc.text('Record ID:', labelX, innerY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(logDetails.id || 'N/A', valueX, innerY, { maxWidth: pageWidth - valueX - 25 });

        innerY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Event Type:', labelX, innerY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(logDetails.eventType || 'N/A', valueX, innerY);

        innerY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Entity Type:', labelX, innerY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(logDetails.entityType || 'N/A', valueX, innerY);

        innerY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Timestamp:', labelX, innerY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        const tsText = logDetails.timestamp ? format(new Date(logDetails.timestamp), 'PPP p') : 'N/A';
        doc.text(tsText, valueX, innerY);

        innerY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Performed By:', labelX, innerY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(logDetails.performedBy || 'System', valueX, innerY);

        // === BLOCKCHAIN PROOF SECTION ===
        yPos = yPos + detailsBoxHeight + 12;

        doc.setTextColor(...accentColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Blockchain Proof', 20, yPos);

        yPos += 5;
        const proofBoxX = 20;
        const proofBoxY = yPos;
        const proofBoxW = pageWidth - 40;
        const proofBoxMinH = 84;
        const proofBoxPadding = 8;

        // Columns
        const leftColumnRatio = 0.65;
        const rightColumnRatio = 1 - leftColumnRatio;
        const proofLeftX = proofBoxX + proofBoxPadding;
        const proofLeftW = proofBoxW * leftColumnRatio - (proofBoxPadding * 2);
        const proofRightX = proofBoxX + proofBoxW * leftColumnRatio + proofBoxPadding;
        const proofRightW = proofBoxW * rightColumnRatio - (proofBoxPadding * 2);

        // Prepare wrapped texts to compute height
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        const txText = blockchainProof.transactionHash || '';
        const txWrapped = doc.splitTextToSize(txText, proofLeftW);
        const merkleText = blockchainProof.merkleRoot || '';
        const merkleWrapped = doc.splitTextToSize(merkleText, proofLeftW);

        const smallLineHeight = 3.8;
        const txHeight = txWrapped.length * smallLineHeight;
        const merkleHeight = merkleWrapped.length * smallLineHeight;

        // compute left content height (rough)
        const leftContentApproxHeight = (1 + 1 + txWrapped.length + 1 + merkleWrapped.length + 1 + 1) * smallLineHeight + 36;
        const proofBoxH = Math.max(proofBoxMinH, leftContentApproxHeight,  /* ensure QR fits */(proofRightW + proofBoxPadding * 2));

        // Draw proof box
        doc.setFillColor(239, 246, 255);
        doc.rect(proofBoxX, proofBoxY, proofBoxW, proofBoxH, 'F');
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(0.5);
        doc.rect(proofBoxX, proofBoxY, proofBoxW, proofBoxH);

        // Left column content
        let pY = proofBoxY + 12;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);

        doc.text('Network:', proofLeftX, pY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Polygon Amoy Testnet (Public Blockchain)', proofLeftX + 35, pY, { maxWidth: proofLeftW - 35 });

        pY += 10;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Transaction Hash:', proofLeftX, pY);
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...accentColor);
        doc.text(txWrapped, proofLeftX, pY + 4);
        pY += 4 + txHeight + 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Block Number:', proofLeftX, pY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(blockchainProof.blockNumber?.toString() || 'N/A', proofLeftX + 35, pY);

        pY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Merkle Root:', proofLeftX, pY);
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...accentColor);
        doc.text(merkleWrapped, proofLeftX, pY + 4);
        pY += 4 + merkleHeight + 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Anchored At:', proofLeftX, pY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        const anchorText = blockchainProof.anchorTimestamp ? format(new Date(blockchainProof.anchorTimestamp), 'PPP p') : 'N/A';
        doc.text(anchorText, proofLeftX + 35, pY);

        pY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateText);
        doc.text('Records in Snapshot:', proofLeftX, pY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text((blockchainProof.totalLogsInSnapshot != null) ? blockchainProof.totalLogsInSnapshot.toString() : 'N/A', proofLeftX + 45, pY);

        // === QR CODE: ensure it fits inside right column ===
        // desired QR size
        let qrSize = 48;
        const maxQrSize = Math.min(qrSize, proofRightW - 6); // leave small margin
        if (maxQrSize <= 0) {
            // if right column too narrow, fallback to placing QR below proof box
            qrSize = 0;
        } else {
            qrSize = maxQrSize;
        }

        let qrDataUrl = null;
        try {
            if (blockchainProof.explorerUrl) {
                qrDataUrl = await QRCode.toDataURL(blockchainProof.explorerUrl, {
                    width: 300,
                    margin: 1,
                    color: {
                        dark: '#1e293b',
                        light: '#ffffff'
                    }
                });
            }
        } catch (qrErr) {
            console.warn('QR generation failed', qrErr);
        }

        if (qrSize > 0 && qrDataUrl) {
            // center QR within right column
            const qrX = proofRightX + (proofRightW - qrSize) / 2;
            const qrY = proofBoxY + (proofBoxH - qrSize) / 2;
            // ensure qrX and qrY stay inside proof box
            const clampedQrX = Math.max(proofBoxX + proofBoxPadding, qrX);
            const clampedQrY = Math.max(proofBoxY + proofBoxPadding, qrY);
            doc.addImage(qrDataUrl, 'PNG', clampedQrX, clampedQrY, qrSize, qrSize);

            // label under QR (if space permits)
            const labelY = clampedQrY + qrSize + 5;
            if (labelY + 6 < proofBoxY + proofBoxH) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...slateText);
                doc.text('Scan to view on', clampedQrX + qrSize / 2, labelY, { align: 'center' });
                doc.text('blockchain explorer', clampedQrX + qrSize / 2, labelY + 5, { align: 'center' });
            }
        } else {
            // If QR couldn't fit, place small label in right column suggesting QR is below
            const fallbackX = proofRightX + 4;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(...slateText);
            doc.text('QR placed below (see next section)', fallbackX, proofBoxY + 12);
        }

        // If QR was not placed inside the right column (qrSize === 0 or qrDataUrl absent),
        // place QR just below the proof box, centered
        if ((qrSize === 0 || !qrDataUrl) && blockchainProof.explorerUrl) {
            try {
                const fallbackQrSize = Math.min(64, proofBoxW - 40);
                const fallbackQrDataUrl = qrDataUrl || await QRCode.toDataURL(blockchainProof.explorerUrl, { width: 300, margin: 1 });
                const fallbackX = proofBoxX + (proofBoxW - fallbackQrSize) / 2;
                const fallbackY = proofBoxY + proofBoxH + 8;
                doc.addImage(fallbackQrDataUrl, 'PNG', fallbackX, fallbackY, fallbackQrSize, fallbackQrSize);
                // adjust where certification statement starts
                // set bottomY accordingly below
            } catch (e) {
                // ignore fallback errors
            }
        }

        // === CERTIFICATION STATEMENT ===
        let bottomY = proofBoxY + proofBoxH + 10;

        const statement = 'This certificate confirms that the above audit record has been cryptographically verified and immutably stored on the Polygon Amoy public blockchain. The record cannot be modified, deleted, or backdated by any party. This proof is valid for regulatory compliance and legal proceedings.';

        const availableHeight = pageHeight - bottomY - 40;
        doc.setFontSize(8);
        const statementLines = doc.splitTextToSize(statement, pageWidth - 40);
        const statementHeight = statementLines.length * 3.8;

        if (statementHeight > availableHeight) {
            doc.addPage();
            bottomY = 20;
        }

        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.3);
        doc.line(20, bottomY, pageWidth - 20, bottomY);

        bottomY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('CERTIFICATION STATEMENT', 20, bottomY);

        bottomY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);

        doc.text(statementLines, 20, bottomY);

        // === FOOTER ===
        const currentPageHeight = doc.internal.pageSize.getHeight();
        let footerY = currentPageHeight - 18;

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${format(new Date(), 'PPP p')}`, 20, footerY);
        doc.text('LivestockIQ Verification System', pageWidth - 20, footerY, { align: 'right' });

        footerY += 5;
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text('This is a computer-generated certificate. No signature required.', pageWidth / 2, footerY, { align: 'center' });

        // Return PDF as buffer
        return Buffer.from(doc.output('arraybuffer'));

    } catch (error) {
        console.error('Error generating PDF certificate:', error);
        throw new Error('Failed to generate certificate: ' + error.message);
    }
};
