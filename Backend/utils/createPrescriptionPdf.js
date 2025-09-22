import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export const generatePrescriptionPdfBuffer = (treatment, farmer, vet) => {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Brand Logo
        doc.fontSize(24).fillColor('#228B22').font('Helvetica-Bold').text('LivestockIQ', { align: 'left' });
        doc.fillColor('black').moveDown(0.5);

        // Header
        doc.fontSize(10).font('Helvetica').text(`Issued by: ${vet.fullName} (License: ${vet.licenseNumber})`, { align: 'right' });
        doc.text(`Date Issued: ${format(new Date(), 'PPP')}`, { align: 'right' });
        doc.moveDown(2);

        // Title
        doc.fontSize(18).font('Helvetica-Bold').text('Official Prescription (Rx)', { align: 'center', underline: true });
        doc.moveDown(1.5);
        
        // Patient & Client Info
        doc.fontSize(12).font('Helvetica-Bold').text('For Patient:', { continued: true });
        doc.font('Helvetica').text(` ${treatment.animal.name || 'N/A'} (ID: ${treatment.animal.tagId})`);
        doc.font('Helvetica-Bold').text('Owned by:', { continued: true });
        doc.font('Helvetica').text(` ${farmer.farmOwner} (${farmer.farmName})`);
        
        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);

        // Prescription Body
        doc.fontSize(16).font('Helvetica-Bold').text(treatment.drugName);
        doc.fontSize(11).font('Helvetica').text(`Dose: ${treatment.dose || 'N/A'} | Route: ${treatment.route || 'N/A'}`);
        doc.moveDown(1);
        
        doc.font('Helvetica-Bold').text('Instructions:');
        doc.font('Helvetica').text(treatment.vetNotes || 'No additional instructions provided.', { width: 400 });
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').text('Withdrawal Information:');
        doc.font('Helvetica').text(`Treatment Start Date: ${format(new Date(treatment.startDate), 'PPP')}`);
        doc.font('Helvetica').text(`Withdrawal End Date: ${treatment.withdrawalEndDate ? format(new Date(treatment.withdrawalEndDate), 'PPP') : 'N/A'}`);
        doc.moveDown(2);

        doc.fontSize(10).font('Helvetica-Oblique').text('This is a digitally generated and signed prescription. Please keep for your records.', { align: 'center' });

        doc.end();
    });
};