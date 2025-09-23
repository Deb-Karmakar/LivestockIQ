import Treatment from '../models/treatment.model.js';
import Farmer from '../models/farmer.model.js';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

// =================================================================
// ## 1. FARMER'S REPORT (Existing Function)
// =================================================================
// @desc    Generate a farm-level AMU Usage PDF Report
// @route   POST /api/reports/amu
// @access  Private (Farmer)
export const generateAmuReport = async (req, res) => {
    try {
        const { from, to } = req.body;
        const farmerId = req.user._id;

        const [farmer, treatments] = await Promise.all([
            Farmer.findById(farmerId),
            Treatment.find({
                farmerId: farmerId,
                status: 'Approved',
                startDate: { $gte: new Date(from), $lte: new Date(to) }
            }).sort({ startDate: 'asc' })
        ]);

        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found.' });
        }

        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="AMU_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        });

        const greenColor = '#228B22';
        doc.fillColor(greenColor).fontSize(24).font('Helvetica-Bold').text('LivestockIQ', 50, 50);
        doc.fillColor('#000000').fontSize(12).font('Helvetica');

        doc.moveDown(2);
        doc.fontSize(20).font('Helvetica-Bold').text('Antimicrobial Usage (AMU) Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Farm: ${farmer.farmName} (${farmer.farmOwner})`);
        doc.text(`Report Period: ${format(new Date(from), 'PPP')} to ${format(new Date(to), 'PPP')}`);
        doc.text(`Generated On: ${format(new Date(), 'PPP')}`);
        doc.moveDown(2);

        const uniqueAnimals = [...new Set(treatments.map(t => t.animalId))].length;
        const uniqueDrugs = [...new Set(treatments.map(t => t.drugName))].length;
        doc.fontSize(14).font('Helvetica-Bold').text('Summary');
        doc.fontSize(10).font('Helvetica').list([
            `Total Approved Treatments: ${treatments.length}`,
            `Total Animals Treated: ${uniqueAnimals}`,
            `Total Unique Drugs Used: ${uniqueDrugs}`
        ]);
        doc.moveDown(2);

        doc.fontSize(14).font('Helvetica-Bold').text('Detailed Treatment Log');
        doc.moveDown();

        const tableTop = doc.y;
        const itemX = 50, dateX = 150, drugX = 300, notesX = 450;
        
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Animal ID', itemX, tableTop);
        doc.text('Treatment Date', dateX, tableTop);
        doc.text('Drug Used', drugX, tableTop);
        doc.text('Vet Notes', notesX, tableTop);
        doc.font('Helvetica');

        let y = tableTop + 20;
        treatments.forEach(t => {
            doc.text(t.animalId, itemX, y);
            doc.text(format(new Date(t.startDate), 'PPP'), dateX, y);
            doc.text(t.drugName, drugX, y);
            doc.text((t.vetNotes || 'N/A').substring(0, 20), notesX, y, {width: 120});
            y += 20;
            if (y > doc.page.height - doc.page.margins.bottom - 20) {
                doc.addPage();
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Animal ID', itemX, doc.page.margins.top);
                doc.text('Treatment Date', dateX, doc.page.margins.top);
                doc.text('Drug Used', drugX, doc.page.margins.top);
                doc.text('Vet Notes', notesX, doc.page.margins.top);
                doc.font('Helvetica');
                y = doc.page.margins.top + 20;
            }
        });

        doc.end();
    } catch (error) {
        console.error("Error generating AMU report:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// =================================================================
// ## 2. VET'S REPORT FOR A SPECIFIC FARM
// =================================================================
// @desc    Generate a farm-specific AMU report for a vet
// @route   POST /api/reports/farm-amu
// @access  Private (Vet)
export const generateFarmAmuReportForVet = async (req, res) => {
    try {
        const { farmerId, from, to } = req.body;
        const vetId = req.user.vetId;

        // Authorization check
        const farmer = await Farmer.findById(farmerId);
        if (!farmer || farmer.vetId !== vetId) {
            return res.status(401).json({ message: 'Not authorized to generate reports for this farm.' });
        }

        const treatments = await Treatment.find({
            farmerId: farmerId,
            status: 'Approved',
            startDate: { $gte: new Date(from), $lte: new Date(to) }
        }).sort({ startDate: 'asc' });

        // The PDF generation is identical to the farmer's report, just using the fetched data
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Farm_AMU_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        });
        
        const greenColor = '#228B22';
        doc.fillColor(greenColor).fontSize(24).font('Helvetica-Bold').text('LivestockIQ', 50, 50);
        doc.fillColor('#000000').fontSize(12).font('Helvetica');

        doc.moveDown(2);
        doc.fontSize(20).font('Helvetica-Bold').text('Antimicrobial Usage (AMU) Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Farm: ${farmer.farmName} (${farmer.farmOwner})`);
        doc.text(`Report Period: ${format(new Date(from), 'PPP')} to ${format(new Date(to), 'PPP')}`);
        doc.text(`Generated On: ${format(new Date(), 'PPP')}`);
        doc.moveDown(2);

        const uniqueAnimals = [...new Set(treatments.map(t => t.animalId))].length;
        const uniqueDrugs = [...new Set(treatments.map(t => t.drugName))].length;
        doc.fontSize(14).font('Helvetica-Bold').text('Summary');
        doc.fontSize(10).font('Helvetica').list([
            `Total Approved Treatments: ${treatments.length}`,
            `Total Animals Treated: ${uniqueAnimals}`,
            `Total Unique Drugs Used: ${uniqueDrugs}`
        ]);
        doc.moveDown(2);
        
        doc.fontSize(14).font('Helvetica-Bold').text('Detailed Treatment Log');
        doc.moveDown();
        
        const tableTop = doc.y;
        const itemX = 50, dateX = 150, drugX = 300, notesX = 450;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Animal ID', itemX, tableTop);
        doc.text('Treatment Date', dateX, tableTop);
        doc.text('Drug Used', drugX, tableTop);
        doc.text('Vet Notes', notesX, tableTop);
        doc.font('Helvetica');
        
        let y = tableTop + 20;
        treatments.forEach(t => {
            doc.text(t.animalId, itemX, y);
            doc.text(format(new Date(t.startDate), 'PPP'), dateX, y);
            doc.text(t.drugName, drugX, y);
            doc.text((t.vetNotes || 'N/A').substring(0, 20), notesX, y, {width: 120});
            y += 20;
            if (y > doc.page.height - doc.page.margins.bottom - 20) {
                doc.addPage();
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Animal ID', itemX, doc.page.margins.top);
                doc.text('Treatment Date', dateX, doc.page.margins.top);
                doc.text('Drug Used', drugX, doc.page.margins.top);
                doc.text('Vet Notes', notesX, doc.page.margins.top);
                doc.font('Helvetica');
                y = doc.page.margins.top + 20;
            }
        });
        
        doc.end();

    } catch (error) {
        console.error("Error generating farm AMU report for vet:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// =================================================================
// ## 3. VET'S PERSONAL SIGNED LOG
// =================================================================
// @desc    Generate a log of all treatments signed by the logged-in vet
// @route   POST /api/reports/vet-log
// @access  Private (Vet)
export const generateVetSignedLog = async (req, res) => {
    try {
        const { from, to } = req.body;
        const vetId = req.user.vetId;

        // 1. Find all farmers supervised by this vet
        const farmers = await Farmer.find({ vetId: vetId });
        const farmerIds = farmers.map(f => f._id);

        // 2. Find all approved treatments for those farmers in the date range
        const treatments = await Treatment.find({
            farmerId: { $in: farmerIds },
            status: 'Approved',
            startDate: { $gte: new Date(from), $lte: new Date(to) }
        }).populate('farmerId', 'farmName farmOwner').sort({ startDate: 'asc' });
        
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Vet_Signed_Log_${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        });

        // PDF Header for Vet Log
        doc.fillColor('#228B22').fontSize(24).font('Helvetica-Bold').text('LivestockIQ', 50, 50);
        doc.fillColor('#000000').fontSize(12).font('Helvetica');
        doc.moveDown(2);
        doc.fontSize(20).font('Helvetica-Bold').text('Signed Treatment Log', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Veterinarian: ${req.user.fullName} (Vet ID: ${req.user.vetId})`);
        doc.text(`Report Period: ${format(new Date(from), 'PPP')} to ${format(new Date(to), 'PPP')}`);
        doc.moveDown(2);
        
        // PDF Table for Vet Log
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', 50, tableTop);
        doc.text('Farm Name', 150, tableTop);
        doc.text('Animal ID', 300, tableTop);
        doc.text('Drug Used', 400, tableTop);
        doc.font('Helvetica');
        
        let y = tableTop + 20;
        treatments.forEach(t => {
            doc.text(format(new Date(t.startDate), 'PPP'), 50, y);
            doc.text(t.farmerId.farmName, 150, y, { width: 140 });
            doc.text(t.animalId, 300, y);
            doc.text(t.drugName, 400, y);
            y += 20;
            if (y > doc.page.height - doc.page.margins.bottom - 20) {
                doc.addPage();
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Date', 50, doc.page.margins.top);
                doc.text('Farm Name', 150, doc.page.margins.top);
                doc.text('Animal ID', 300, doc.page.margins.top);
                doc.text('Drug Used', 400, doc.page.margins.top);
                doc.font('Helvetica');
                y = doc.page.margins.top + 20;
            }
        });

        doc.end();
    } catch (error) {
        console.error("Error generating vet signed log:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};