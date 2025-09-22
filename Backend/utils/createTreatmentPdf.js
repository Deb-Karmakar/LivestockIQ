import PDFDocument from 'pdfkit';

// This function creates a PDF in memory and returns it as a Buffer
export const generateTreatmentPdfBuffer = (treatment, farmer, vet) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // --- PDF Content ---

        // Logo
        doc.fontSize(24).fillColor('#228B22').font('Helvetica-Bold').text('LivestockIQ', { align: 'left' });
        
        // Header
        doc.moveDown(1);
        doc.fontSize(20).fillColor('black').font('Helvetica-Bold').text('New Treatment Record', { align: 'left' });
        doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`);

        doc.moveDown(2);
        
        // Farmer and Vet Info
        doc.fontSize(12).font('Helvetica-Bold').text('Farmer Details:', { underline: true });
        doc.font('Helvetica').text(`${farmer.farmOwner} (${farmer.farmName})`);
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Supervising Vet:', { underline: true });
        doc.font('Helvetica').text(`${vet.fullName} (ID: ${vet.vetId})`);
        
        doc.moveDown(2);

        // Treatment Details
        doc.fontSize(14).font('Helvetica-Bold').text('Treatment Details', { underline: true });
        doc.moveDown(1);

        // CORRECTED: The object for 'Start Date' was missing the "value" key.
        const details = [
            { label: 'Animal ID:', value: treatment.animalId },
            { label: 'Drug Name:', value: treatment.drugName },
            { label: 'Dose:', value: treatment.dose || 'N/A' },
            { label: 'Route:', value: treatment.route || 'N/A' },
            { label: 'Start Date:', value: new Date(treatment.startDate).toLocaleDateString() },
            { label: 'Reason/Notes:', value: treatment.notes || 'N/A' },
        ];

        details.forEach(({ label, value }) => {
            doc.fontSize(11).font('Helvetica-Bold').text(label, { continued: true });
            doc.font('Helvetica').text(` ${value}`);
            doc.moveDown(0.5);
        });

        doc.end(); // Finalize the PDF
    });
};