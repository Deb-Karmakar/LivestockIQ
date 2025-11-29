// Backend/services/pdfGenerator.service.js

import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

/**
 * Generate confirmation PDF for farmer when recording feed administration
 */
export const generateFarmerFeedConfirmation = (feedAdmin, farmer, feed, animals) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Header
            doc.fontSize(24).fillColor('#228B22').text('LivestockIQ', { align: 'left' });
            doc.moveDown(0.5);
            doc.fontSize(18).fillColor('#000').text('Feed Administration Confirmation', { align: 'left' });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#666').text(`Confirmation ID: ${feedAdmin._id}`, { align: 'left' });
            doc.fontSize(10).text(`Date: ${format(new Date(), 'PPP')}`, { align: 'left' });

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Farmer Details
            doc.fontSize(14).fillColor('#000').text('Farmer Information', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).text(`Owner: ${farmer.farmOwner}`);
            doc.text(`Farm: ${farmer.farmName}`);
            doc.text(`Email: ${farmer.email}`);

            doc.moveDown(1);

            // Feed Details
            doc.fontSize(14).text('Feed Medication Details', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).text(`Feed Name: ${feed.feedName}`);
            doc.text(`Antimicrobial: ${feed.antimicrobialName}`);
            doc.text(`Quantity Used: ${feedAdmin.feedQuantityUsed} ${feed.unit}`);
            doc.text(`Antimicrobial Concentration: ${feed.antimicrobialConcentration} ${feed.concentrationUnit}`);
            doc.text(`Total Antimicrobial Dose: ${feedAdmin.antimicrobialDoseTotal?.toFixed(2) || 'N/A'} ${feed.concentrationUnit}`);

            doc.moveDown(1);

            // Animal Details
            doc.fontSize(14).text('Animals/Group Information', { underline: true });
            doc.moveDown(0.5);
            if (feedAdmin.groupName) {
                doc.fontSize(11).text(`Group Name: ${feedAdmin.groupName}`);
            }
            doc.text(`Number of Animals: ${feedAdmin.numberOfAnimals || animals.length}`);
            doc.moveDown(0.5);

            doc.fontSize(10).text('Animal Tag IDs:', { underline: true });
            const tagList = animals.map(a => a.tagId).join(', ');
            doc.fontSize(9).text(tagList, { width: 500 });

            doc.moveDown(1);

            // Withdrawal Period
            doc.fontSize(14).fillColor('#000').text('Withdrawal Period', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).text(`Start Date: ${format(new Date(feedAdmin.startDate), 'PPP')}`);
            doc.text(`Expected Withdrawal End: ${feedAdmin.withdrawalEndDate ? format(new Date(feedAdmin.withdrawalEndDate), 'PPP') : 'TBD'}`);
            doc.text(`Withdrawal Days: ${feed.withdrawalPeriodDays} days`);

            doc.moveDown(1);

            // Status
            doc.fontSize(14).text('Status', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor(feedAdmin.status === 'Pending Approval' ? '#FFA500' : '#228B22')
                .text(`Current Status: ${feedAdmin.status}`);

            if (feedAdmin.status === 'Pending Approval') {
                doc.fillColor('#000').fontSize(10).text('\nYour supervising veterinarian has been notified and will review this administration.');
            }

            // Footer
            doc.moveDown(2);
            doc.fontSize(8).fillColor('#666').text(
                'This is an automated confirmation. Keep this for your records.',
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate confirmation PDF for vet when approving feed administration
 */
export const generateVetFeedApprovalPDF = (feedAdmin, vet, farmer, feed, animals) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Header
            doc.fontSize(24).fillColor('#228B22').text('LivestockIQ', { align: 'left' });
            doc.moveDown(0.5);
            doc.fontSize(18).fillColor('#000').text('Veterinary Approval Confirmation', { align: 'left' });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#666').text(`Approval ID: ${feedAdmin._id}`, { align: 'left' });
            doc.fontSize(10).text(`Date: ${format(new Date(), 'PPP')}`, { align: 'left' });

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Vet Details
            doc.fontSize(14).fillColor('#000').text('Veterinarian Information', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).text(`Name: Dr. ${vet.fullName}`);
            doc.text(`License: ${vet.licenseNumber || 'N/A'}`);
            doc.text(`Contact: ${vet.email}`);

            doc.moveDown(1);

            // Farmer Details
            doc.fontSize(14).text('Farmer Information', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).text(`Owner: ${farmer.farmOwner}`);
            doc.text(`Farm: ${farmer.farmName}`);

            doc.moveDown(1);

            // Feed Medication Details
            doc.fontSize(14).text('Approved Feed Medication', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).text(`Feed: ${feed.feedName}`);
            doc.text(`Antimicrobial: ${feed.antimicrobialName}`);
            doc.text(`Quantity: ${feedAdmin.feedQuantityUsed} ${feed.unit}`);
            doc.text(`Total Antimicrobial Dose: ${feedAdmin.antimicrobialDoseTotal?.toFixed(2)} ${feed.concentrationUnit}`);

            doc.moveDown(1);

            // Animals
            doc.fontSize(14).text('Animals Covered', { underline: true });
            doc.moveDown(0.5);
            if (feedAdmin.groupName) {
                doc.fontSize(11).text(`Group: ${feedAdmin.groupName}`);
            }
            doc.text(`Number of Animals: ${animals.length}`);
            doc.fontSize(9).text(`Tag IDs: ${animals.map(a => a.tagId).join(', ')}`, { width: 500 });

            doc.moveDown(1);

            // Withdrawal
            doc.fontSize(14).text('Withdrawal Period', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).text(`Start: ${format(new Date(feedAdmin.startDate), 'PPP')}`);
            doc.text(`End: ${format(new Date(feedAdmin.withdrawalEndDate), 'PPP')}`);
            doc.text(`Duration: ${feed.withdrawalPeriodDays} days`);

            // Vet Notes
            if (feedAdmin.notes) {
                doc.moveDown(1);
                doc.fontSize(14).text('Veterinary Notes', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(10).text(feedAdmin.notes, { width: 500 });
            }

            // Footer
            doc.moveDown(2);
            doc.fontSize(8).fillColor('#666').text(
                'This document confirms veterinary approval of the above feed medication administration.',
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate prescription PDF for farmer (sent via email after vet approval)
 */
export const generateFeedPrescriptionPDF = (feedAdmin, vet, farmer, feed, animals) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Header with border
            doc.rect(40, 40, 520, 100).stroke();
            doc.fontSize(28).fillColor('#228B22').text('LivestockIQ', 50, 55);
            doc.fontSize(20).fillColor('#000').text('VETERINARY PRESCRIPTION', 50, 90);
            doc.fontSize(10).fillColor('#666').text(`Prescription No: ${feedAdmin._id}`, 50, 115);

            doc.moveDown(4);

            // Prescribing Vet
            doc.fontSize(12).fillColor('#000').text('Prescribed By:', 50, 160, { underline: true });
            doc.fontSize(11).text(`Dr. ${vet.fullName}`, 50, 180);
            doc.text(`License: ${vet.licenseNumber || 'N/A'}`, 50, 195);
            doc.text(`Date: ${format(new Date(), 'PPP')}`, 50, 210);

            // Farmer/Farm
            doc.fontSize(12).text('Prescribed To:', 300, 160, { underline: true });
            doc.fontSize(11).text(`${farmer.farmOwner}`, 300, 180);
            doc.text(`${farmer.farmName}`, 300, 195);
            doc.text(`${farmer.email}`, 300, 210);

            doc.moveDown(2);
            doc.moveTo(50, 240).lineTo(550, 240).stroke();
            doc.moveDown(1);

            // Prescription Details
            doc.fontSize(16).fillColor('#228B22').text('PRESCRIPTION DETAILS', 50, 260);
            doc.moveDown(1);

            const detailsY = 290;
            doc.fontSize(11).fillColor('#000');

            // Feed Medication
            doc.text('Feed Medication:', 50, detailsY, { underline: true, continued: false });
            doc.fontSize(12).text(`${feed.feedName}`, 50, detailsY + 20);

            // Antimicrobial
            doc.fontSize(11).text('Active Antimicrobial:', 50, detailsY + 45);
            doc.fontSize(12).text(`${feed.antimicrobialName}`, 50, detailsY + 65);

            // Dosage
            doc.fontSize(11).text('Quantity Prescribed:', 50, detailsY + 90);
            doc.fontSize(12).text(`${feedAdmin.feedQuantityUsed} ${feed.unit}`, 50, detailsY + 110);

            doc.fontSize(11).text('Antimicrobial Concentration:', 300, detailsY + 90);
            doc.fontSize(12).text(`${feed.antimicrobialConcentration} ${feed.concentrationUnit}`, 300, detailsY + 110);

            // Animals
            doc.fontSize(11).text('Animals/Group:', 50, detailsY + 140);
            if (feedAdmin.groupName) {
                doc.fontSize(12).text(`Group: ${feedAdmin.groupName}`, 50, detailsY + 160);
            }
            doc.fontSize(11).text(`Number of Animals: ${animals.length}`, 50, detailsY + (feedAdmin.groupName ? 180 : 160));

            // Withdrawal Period - IMPORTANT
            doc.moveDown(3);
            doc.rect(40, detailsY + 220, 520, 80).fillAndStroke('#FFF9E6', '#FFA500');
            doc.fontSize(14).fillColor('#D97706').text('⚠ WITHDRAWAL PERIOD', 50, detailsY + 235);
            doc.fontSize(11).fillColor('#000');
            doc.text(`Start Date: ${format(new Date(feedAdmin.startDate), 'PPP')}`, 50, detailsY + 260);
            doc.text(`Withdrawal End Date: ${format(new Date(feedAdmin.withdrawalEndDate), 'PPP')}`, 300, detailsY + 260);
            doc.fontSize(10).fillColor('#D97706').text(`⚠ Animals MUST NOT be sold or slaughtered before ${format(new Date(feedAdmin.withdrawalEndDate), 'PPP')}`, 50, detailsY + 280, { width: 500 });

            // Instructions
            doc.moveDown(4);
            doc.fontSize(12).fillColor('#000').text('Instructions:', 50, detailsY + 330, { underline: true });
            doc.fontSize(10).text('1. Administer feed medication as prescribed', 50, detailsY + 350);
            doc.text('2. Monitor animals daily for adverse reactions', 50, detailsY + 365);
            doc.text('3. Keep detailed records of administration', 50, detailsY + 380);
            doc.text('4. Respect withdrawal period strictly', 50, detailsY + 395);
            doc.text('5. MRL testing required after withdrawal period ends', 50, detailsY + 410);

            // Vet Notes
            if (feedAdmin.notes) {
                doc.moveDown(3);
                doc.fontSize(12).text('Veterinary Notes:', { underline: true });
                doc.fontSize(10).text(feedAdmin.notes, { width: 500 });
            }

            // Signature Section
            doc.moveDown(3);
            doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
            doc.fontSize(10).text('Veterinarian Signature', 50, doc.y + 5);
            doc.text(`Dr. ${vet.fullName}`, 50, doc.y + 5);

            // Footer
            doc.fontSize(8).fillColor('#999').text(
                'This prescription is valid for the specified animals and withdrawal period only. Unauthorized use is prohibited.',
                50, 750, { align: 'center', width: 500 }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
