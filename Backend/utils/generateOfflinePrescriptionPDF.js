import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

/**
 * Generate a professional prescription PDF for offline treatments
 * @param {Object} treatmentData - Treatment record data
 * @returns {Buffer} PDF buffer
 */
export const generateOfflinePrescriptionPDF = async (treatmentData) => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Color palette
        const primaryColor = [16, 185, 129]; // Green-500
        const darkGray = [31, 41, 55]; // Gray-800
        const lightGray = [156, 163, 175]; // Gray-400
        const warningColor = [245, 158, 11]; // Amber-500

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('PRESCRIPTION', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Offline Treatment Record', pageWidth / 2, 23, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(240, 240, 240);
        doc.text(`Record ID: ${treatmentData.recordId}`, pageWidth / 2, 30, { align: 'center' });
        doc.text(`Date: ${treatmentData.treatmentDate}`, pageWidth / 2, 36, { align: 'center' });

        let yPos = 50;

        // Vet Details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.text('Veterinarian Details', 20, yPos);

        yPos += 6;
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.2);
        doc.line(20, yPos, pageWidth - 20, yPos);

        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Dr. ${treatmentData.vetName}`, 20, yPos);

        yPos += 12;

        // Farmer Details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.text('Farmer & Farm Details', 20, yPos);

        yPos += 6;
        doc.line(20, yPos, pageWidth - 20, yPos);

        yPos += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        doc.setFont('helvetica', 'bold');
        doc.text('Farmer:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(treatmentData.farmerName, 50, yPos);

        if (treatmentData.farmerPhone) {
            yPos += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('Phone:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(treatmentData.farmerPhone, 50, yPos);
        }

        if (treatmentData.farmName) {
            yPos += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('Farm:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(treatmentData.farmName, 50, yPos);
        }

        if (treatmentData.farmerAddress) {
            yPos += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('Address:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            const addressLines = doc.splitTextToSize(treatmentData.farmerAddress, pageWidth - 70);
            doc.text(addressLines, 50, yPos);
            yPos += (addressLines.length - 1) * 5;
        }

        yPos += 12;

        // Animal Details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.text('Animal Details', 20, yPos);

        yPos += 6;
        doc.line(20, yPos, pageWidth - 20, yPos);

        yPos += 6;
        doc.setFontSize(9);

        doc.setFont('helvetica', 'bold');
        doc.text('Species:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(treatmentData.animalSpecies, 50, yPos);

        if (treatmentData.animalTagId) {
            doc.setFont('helvetica', 'bold');
            doc.text('Tag ID:', 115, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(treatmentData.animalTagId, 140, yPos);
        }

        yPos += 5;
        if (treatmentData.animalBreed) {
            doc.setFont('helvetica', 'bold');
            doc.text('Breed:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(treatmentData.animalBreed, 50, yPos);
            yPos += 5;
        }

        if (treatmentData.animalAge || treatmentData.animalWeight) {
            if (treatmentData.animalAge) {
                doc.setFont('helvetica', 'bold');
                doc.text('Age:', 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(treatmentData.animalAge, 50, yPos);
            }

            if (treatmentData.animalWeight) {
                doc.setFont('helvetica', 'bold');
                doc.text('Weight:', 115, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(`${treatmentData.animalWeight} kg`, 140, yPos);
            }
            yPos += 5;
        }

        yPos += 7;

        // Diagnosis
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.text('Diagnosis & Symptoms', 20, yPos);

        yPos += 6;
        doc.line(20, yPos, pageWidth - 20, yPos);

        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // Red
        doc.text(treatmentData.diagnosis, 20, yPos);

        if (treatmentData.symptoms) {
            yPos += 6;
            doc.setFontSize(9);
            doc.setTextColor(...darkGray);
            doc.setFont('helvetica', 'normal');
            const symptomLines = doc.splitTextToSize(treatmentData.symptoms, pageWidth - 40);
            doc.text(symptomLines, 20, yPos);
            yPos += symptomLines.length * 5;
        }

        yPos += 10;

        // Prescriptions (Rx)
        doc.setFillColor(239, 246, 255); // Light blue background
        doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('℞  PRESCRIPTION', 20, yPos);

        yPos += 12;

        // Prescription items
        treatmentData.prescriptions.forEach((prescription, index) => {
            // Check if we need a new page
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = 20;
            }

            // Box for each prescription
            const boxHeight = prescription.withdrawalPeriod ? 38 : 30;
            doc.setDrawColor(...lightGray);
            doc.setLineWidth(0.3);
            doc.rect(20, yPos - 5, pageWidth - 40, boxHeight);

            // Drug number and name
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkGray);
            doc.text(`${index + 1}. ${prescription.drugName}`, 23, yPos);

            yPos += 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            // Details in two columns
            doc.setFont('helvetica', 'bold');
            doc.text('Dosage:', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(prescription.dosage, 50, yPos);

            if (prescription.frequency) {
                doc.setFont('helvetica', 'bold');
                doc.text('Frequency:', 110, yPos);
                doc.setFont('helvetica', 'normal');
                const freqText = doc.splitTextToSize(prescription.frequency, 55);
                doc.text(freqText, 140, yPos);
            }

            yPos += 5;

            if (prescription.duration) {
                doc.setFont('helvetica', 'bold');
                doc.text('Duration:', 25, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(prescription.duration, 50, yPos);
            }

            if (prescription.route) {
                doc.setFont('helvetica', 'bold');
                doc.text('Route:', 110, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(prescription.route, 140, yPos);
            }

            yPos += 5;

            // Withdrawal period warning
            if (prescription.withdrawalPeriod) {
                doc.setFillColor(255, 251, 235); // Light amber background
                doc.rect(25, yPos - 2, pageWidth - 50, 10, 'F');

                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...warningColor);
                doc.text(`⚠ WITHDRAWAL PERIOD: ${prescription.withdrawalPeriod} days`, 28, yPos + 3);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.text('Do not consume animal products during this period', 28, yPos + 7);
                yPos += 11;
            }

            if (prescription.notes) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(...lightGray);
                const notesLines = doc.splitTextToSize(`Note: ${prescription.notes}`, pageWidth - 50);
                doc.text(notesLines, 25, yPos);
                yPos += notesLines.length * 4;
            }

            yPos += boxHeight - 25;
        });

        yPos += 10;

        // General Notes
        if (treatmentData.generalNotes) {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkGray);
            doc.text('General Notes', 20, yPos);

            yPos += 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            const notesLines = doc.splitTextToSize(treatmentData.generalNotes, pageWidth - 40);
            doc.text(notesLines, 20, yPos);
            yPos += notesLines.length * 5 + 10;
        }

        // Follow-up
        if (treatmentData.followUpDate) {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            doc.text(`Follow-up Scheduled: ${treatmentData.followUpDate}`, 20, yPos);
        }

        // Footer
        const footerY = pageHeight - 20;
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.2);
        doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.setFont('helvetica', 'normal');
        doc.text('LivestockIQ Veterinary Management System', 20, footerY);
        doc.text(`Generated: ${format(new Date(), 'PPP p')}`, pageWidth - 20, footerY, { align: 'right' });

        doc.setFontSize(7);
        doc.text('This is a computer-generated prescription. Digital record maintained on blockchain.', pageWidth / 2, footerY + 5, { align: 'center' });

        // Return PDF as buffer
        return Buffer.from(doc.output('arraybuffer'));

    } catch (error) {
        console.error('Error generating prescription PDF:', error);
        throw new Error('Failed to generate prescription PDF: ' + error.message);
    }
};
