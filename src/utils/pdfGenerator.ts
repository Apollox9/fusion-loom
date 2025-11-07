import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Student {
  fullName: string;
}

interface ClassData {
  className: string;
  students: Student[];
}

const COLORS = {
  lightGarments: [
    { name: 'White', color: [255, 255, 255] },
    { name: 'Light Yellow', color: [255, 255, 224] },
    { name: 'Pastel Pink', color: [255, 209, 220] },
    { name: 'Mint Green', color: [152, 255, 152] },
    { name: 'Sky Blue', color: [135, 206, 235] },
    { name: 'Peach', color: [255, 218, 185] },
    { name: 'Lavender', color: [230, 230, 250] },
    { name: 'Light Coral', color: [240, 128, 128] },
    { name: 'Baby Blue', color: [137, 207, 240] },
    { name: 'Light Grey', color: [211, 211, 211] },
    { name: 'Powder Blue', color: [176, 224, 230] },
    { name: 'Cream / Ivory', color: [255, 253, 208] },
    { name: 'Pale Orange', color: [255, 239, 213] },
    { name: 'Pale Green', color: [152, 251, 152] },
    { name: 'Pale Purple', color: [221, 160, 221] }
  ],
  darkGarments: [
    { name: 'Black', color: [0, 0, 0] },
    { name: 'Navy Blue', color: [0, 0, 128] },
    { name: 'Forest Green', color: [34, 139, 34] },
    { name: 'Maroon / Burgundy', color: [128, 0, 0] },
    { name: 'Charcoal Grey', color: [54, 69, 79] },
    { name: 'Royal Blue', color: [65, 105, 225] },
    { name: 'Plum / Eggplant', color: [142, 69, 133] },
    { name: 'Dark Brown', color: [101, 67, 33] },
    { name: 'Dark Olive', color: [85, 107, 47] },
    { name: 'Crimson', color: [220, 20, 60] },
    { name: 'Teal', color: [0, 128, 128] },
    { name: 'Deep Purple', color: [75, 0, 130] },
    { name: 'Rust', color: [183, 65, 14] },
    { name: 'Slate Blue', color: [106, 90, 205] },
    { name: 'Midnight Blue', color: [25, 25, 112] }
  ],
  neutral: [
    'Red (Bright → black ink; Deep → white ink)',
    'Orange (Lighter → black; Burnt → white)',
    'Medium Grey (Depends on undertone)',
    'Turquoise / Aqua',
    'Gold / Mustard',
    'Khaki / Tan'
  ]
};

export function generateClassFormPDF(classData: ClassData, schoolName: string): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 15;

  // Add watermark
  doc.setFontSize(80);
  doc.setTextColor(240, 240, 240);
  doc.text('PROJECT FUSION', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Header Section
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT FUSION', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('We make it permanent.', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, currentY, pageWidth - 15, currentY);
  
  currentY += 8;

  // School and Class Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`School: ${schoolName}`, 15, currentY);
  doc.text(`Class: ${classData.className}`, pageWidth - 15, currentY, { align: 'right' });
  
  currentY += 8;

  // Form Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENTS GARMENT INFORMATION AND PAYMENTS FORM', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 5;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, currentY, pageWidth - 15, currentY);
  
  currentY += 8;

  // Table
  const tableData = classData.students.map((student, index) => [
    (index + 1).toString(),
    student.fullName,
    '',
    '',
    ''
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No.', 'Student Name', 'Dark Garment Count', 'Light Garment Count', 'Payment Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 35 }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didDrawCell: (data) => {
      // Add placeholder text for empty cells
      if (data.section === 'body' && data.column.index >= 2) {
        const cell = data.cell;
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        
        let placeholderText = '';
        if (data.column.index === 2) placeholderText = 'Enter count';
        else if (data.column.index === 3) placeholderText = 'Enter count';
        else if (data.column.index === 4) placeholderText = 'Tick if paid';
        
        if (placeholderText) {
          doc.text(placeholderText, cell.x + cell.width / 2, cell.y + cell.height / 2, {
            align: 'center',
            baseline: 'middle'
          });
        }
        doc.setTextColor(0, 0, 0);
      }
    }
  });

  // Add new page for color guide
  doc.addPage();
  currentY = 15;

  // Color Guidance Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COLOR GUIDANCE FOR INK SELECTION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  // Light Garments Section
  doc.setFontSize(12);
  doc.text('Light Garments (Use Black Ink)', 15, currentY);
  currentY += 7;

  // Draw color boxes for light garments
  const boxSize = 15;
  const boxSpacing = 2;
  const colsPerRow = 5;
  let currentX = 15;
  let rowY = currentY;

  COLORS.lightGarments.forEach((colorItem, index) => {
    if (index > 0 && index % colsPerRow === 0) {
      rowY += boxSize + 10;
      currentX = 15;
    }

    // Draw color box
    doc.setFillColor(colorItem.color[0], colorItem.color[1], colorItem.color[2]);
    doc.setDrawColor(100, 100, 100);
    doc.rect(currentX, rowY, boxSize, boxSize, 'FD');

    // Draw label
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const labelLines = doc.splitTextToSize(colorItem.name, boxSize);
    doc.text(labelLines, currentX + boxSize / 2, rowY + boxSize + 3, { align: 'center' });

    currentX += boxSize + boxSpacing + 20;
  });

  currentY = rowY + boxSize + 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Rule of thumb: If the garment feels "soft," "light," or pastel, black ink is usually the better choice.', 15, currentY);
  currentY += 10;

  // Dark Garments Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dark Garments (Use White Ink)', 15, currentY);
  currentY += 7;

  currentX = 15;
  rowY = currentY;

  COLORS.darkGarments.forEach((colorItem, index) => {
    if (index > 0 && index % colsPerRow === 0) {
      rowY += boxSize + 10;
      currentX = 15;
    }

    doc.setFillColor(colorItem.color[0], colorItem.color[1], colorItem.color[2]);
    doc.setDrawColor(100, 100, 100);
    doc.rect(currentX, rowY, boxSize, boxSize, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    const labelLines = doc.splitTextToSize(colorItem.name, boxSize);
    doc.text(labelLines, currentX + boxSize / 2, rowY + boxSize / 2, { 
      align: 'center',
      baseline: 'middle'
    });

    currentX += boxSize + boxSpacing + 20;
  });

  currentY = rowY + boxSize + 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 0, 0);
  doc.text('Rule of thumb: If the garment feels "deep," "bold," or rich in color, white ink stands out better.', 15, currentY);
  currentY += 10;

  // Neutral Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Colors Where Both Inks May Work', 15, currentY);
  currentY += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  COLORS.neutral.forEach((item) => {
    const bulletPoint = '\u2022'; // Bullet character
    doc.text(`${bulletPoint} ${item}`, 20, currentY);
    currentY += 5;
  });

  currentY += 5;

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Return this form to your class monitor after completion.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.setFontSize(8);
  doc.text('©2025 Blaqlogic Digitals. All rights reserved.', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}
