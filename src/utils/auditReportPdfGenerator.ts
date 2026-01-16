import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import ProjectFusionLogo from '@/assets/project-fusion-logo.png';

interface AuditTrailEntry {
  timestamp: string;
  auditor_id: string;
  auditor_name: string;
  action: string;
  field: string;
  old_value: any;
  new_value: any;
  entity_type: 'order' | 'class' | 'student';
  entity_id: string;
  entity_name: string;
}

interface SubmittedData {
  session?: {
    total_students: number;
    total_garments: number;
    total_dark_garments: number;
    total_light_garments: number;
    total_classes: number;
  };
  classes?: Array<{
    id: string;
    name: string;
    submitted_students_count: number;
  }>;
  students?: Array<{
    id: string;
    full_name: string;
    class_id: string;
    submitted_light_garment_count: number;
    submitted_dark_garment_count: number;
  }>;
}

interface AuditReportData {
  auditReport: {
    id: string;
    session_id: string;
    auditor_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    total_students_audited: number;
    students_with_discrepancies: number;
    discrepancies_found: boolean;
  };
  orderData: {
    school_name: string;
    headmaster_name: string;
    district: string;
    region: string;
    country: string;
    external_ref: string;
    total_students: number;
    total_garments: number;
    total_dark_garments: number;
    total_light_garments: number;
    total_classes_to_serve: number;
    status: string;
    created_at: string;
  };
  auditorName: string;
  submittedData: SubmittedData | null;
  auditTrail: AuditTrailEntry[];
  classes: any[];
  students: any[];
  logoBase64?: string;
}

// Load logo as base64 for PDF embedding
async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch(ProjectFusionLogo);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Format field names properly - remove underscores and format nicely
const formatFieldName = (field: string): string => {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export async function generateAuditReportPDF(data: AuditReportData): Promise<jsPDF> {
  const { auditReport, orderData, auditorName, submittedData, auditTrail, classes, students } = data;
  
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 15;
  
  // Load logo
  const logoBase64 = await loadLogoAsBase64();
  
  const addPageIfNeeded = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - 25) {
      doc.addPage();
      currentY = 20;
    }
  };

  // ===== HEADER WITH LOGO =====
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 30, currentY - 5, 60, 15);
      currentY += 15;
    } catch {
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('PROJECT FUSION', pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }
  } else {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('PROJECT FUSION', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
  }
  
  currentY += 3;
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(15, currentY, pageWidth - 15, currentY);
  
  currentY += 8;

  // ===== REPORT TITLE =====
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('SESSION AUDIT REPORT', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;

  // ===== REPORT META INFO =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const metaInfo = [
    ['Report ID:', auditReport.id.slice(0, 8).toUpperCase()],
    ['Session ID:', auditReport.session_id],
    ['Auditor:', auditorName],
    ['Date Generated:', format(new Date(), 'MMMM d, yyyy \u2022 h:mm a')],
    ['Audit Status:', auditReport.status]
  ];
  
  metaInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(value || 'N/A', 55, currentY);
    currentY += 5;
  });
  
  currentY += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, currentY, pageWidth - 15, currentY);
  currentY += 6;

  // ===== SCHOOL INFORMATION =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('School Information', 15, currentY);
  currentY += 5;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const schoolInfo = [
    ['School Name:', orderData.school_name],
    ['Headmaster:', orderData.headmaster_name],
    ['Location:', `${orderData.district || ''}, ${orderData.region || ''}, ${orderData.country || ''}`],
    ['Order Status:', orderData.status],
    ['Order Date:', orderData.created_at ? format(new Date(orderData.created_at), 'MMMM d, yyyy') : 'N/A']
  ];
  
  schoolInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(value || 'N/A', 55, currentY);
    currentY += 5;
  });
  
  currentY += 6;

  // ===== DATA COMPARISON =====
  addPageIfNeeded(60);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('Data Comparison', 15, currentY);
  currentY += 5;

  const submittedSession = submittedData?.session;
  
  // Calculate collected totals from actual student data (auto-calculated)
  const collectedStudents = students.length;
  const collectedLightGarments = students.reduce((sum, s) => sum + (s.total_light_garment_count || 0), 0);
  const collectedDarkGarments = students.reduce((sum, s) => sum + (s.total_dark_garment_count || 0), 0);
  const collectedGarments = collectedLightGarments + collectedDarkGarments;
  const collectedClasses = classes.length;
  
  const subStudents = submittedSession?.total_students ?? orderData.total_students ?? 0;
  const subGarments = submittedSession?.total_garments ?? orderData.total_garments ?? 0;
  const subLight = submittedSession?.total_light_garments ?? orderData.total_light_garments ?? 0;
  const subDark = submittedSession?.total_dark_garments ?? orderData.total_dark_garments ?? 0;
  const subClasses = submittedSession?.total_classes ?? orderData.total_classes_to_serve ?? 0;
  
  const comparisonData = [
    ['Metric', 'Submitted', 'Collected', 'Discrepancy'],
    ['Total Students', String(subStudents), String(collectedStudents), String(collectedStudents - subStudents)],
    ['Total Garments', String(subGarments), String(collectedGarments), String(collectedGarments - subGarments)],
    ['Light Garments', String(subLight), String(collectedLightGarments), String(collectedLightGarments - subLight)],
    ['Dark Garments', String(subDark), String(collectedDarkGarments), String(collectedDarkGarments - subDark)],
    ['Total Classes', String(subClasses), String(collectedClasses), String(collectedClasses - subClasses)]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [comparisonData[0]],
    body: comparisonData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' }
    },
    margin: { bottom: 20 },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const val = parseInt(data.cell.text[0] || '0');
        if (val > 0) {
          data.cell.styles.textColor = [0, 128, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (val < 0) {
          data.cell.styles.textColor = [220, 53, 69];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ===== AUDIT SUMMARY =====
  addPageIfNeeded(40);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('Audit Summary', 15, currentY);
  currentY += 5;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const summaryData = [
    ['Total Students Audited:', String(auditReport.total_students_audited || 0)],
    ['Students with Discrepancies:', String(auditReport.students_with_discrepancies || 0)],
    ['Discrepancies Found:', auditReport.discrepancies_found ? 'Yes' : 'No'],
    ['Total Classes:', String(classes.length)],
    ['Total Audit Trail Entries:', String(auditTrail.length)]
  ];
  
  summaryData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 75, currentY);
    currentY += 5;
  });
  
  currentY += 6;

  // ===== CLASS SUMMARY =====
  if (classes.length > 0) {
    addPageIfNeeded(35);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('Classes Summary', 15, currentY);
    currentY += 5;

    const classTableData = classes.map((cls, index) => {
      const submittedClass = submittedData?.classes?.find(c => c.id === cls.id);
      const studentsInClass = students.filter(s => s.class_id === cls.id);
      return [
        String(index + 1),
        cls.name || 'Unknown',
        String(submittedClass?.submitted_students_count || cls.total_students_to_serve_in_class || 0),
        String(studentsInClass.length),
        cls.is_audited ? 'Yes' : 'No'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Class Name', 'Students (Submitted)', 'Students (Collected)', 'Audited']],
      body: classTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'left' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' }
      },
      margin: { bottom: 20 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== DISCREPANCIES LIST =====
  const discrepancies = auditTrail.filter(entry => entry.action === 'UPDATE');
  
  if (discrepancies.length > 0) {
    addPageIfNeeded(40);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69);
    doc.text('Discrepancies Found', 15, currentY);
    currentY += 5;

    const discrepancyData = discrepancies.map((entry, index) => [
      String(index + 1),
      entry.entity_type.charAt(0).toUpperCase() + entry.entity_type.slice(1),
      entry.entity_name || 'Unknown',
      formatFieldName(entry.field),
      String(entry.old_value),
      String(entry.new_value),
      format(new Date(entry.timestamp), 'MMM d, h:mm a')
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Type', 'Name', 'Field', 'Old', 'New', 'Time']],
      body: discrepancyData,
      theme: 'striped',
      headStyles: {
        fillColor: [220, 53, 69],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'left', cellWidth: 35 },
        3: { halign: 'left', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 15 },
        6: { halign: 'center', cellWidth: 30 }
      },
      margin: { bottom: 20 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== AUDIT TRAIL =====
  if (auditTrail.length > 0) {
    addPageIfNeeded(40);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('Complete Audit Trail', 15, currentY);
    currentY += 5;

    const trailData = auditTrail.map((entry, index) => [
      String(index + 1),
      format(new Date(entry.timestamp), 'MMM d, h:mm:ss a'),
      entry.auditor_name || 'Unknown',
      `${entry.action} ${entry.entity_type}`,
      entry.entity_name || 'N/A',
      `${formatFieldName(entry.field)}: ${entry.old_value} \u2192 ${entry.new_value}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Timestamp', 'Auditor', 'Action', 'Entity', 'Change']],
      body: trailData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 7,
        cellPadding: 3,
        overflow: 'linebreak',
        minCellHeight: 8
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'left', cellWidth: 22 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'left', cellWidth: 28 },
        5: { halign: 'left', cellWidth: 'auto', overflow: 'linebreak' }
      },
      margin: { bottom: 25 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== SIGNATURE SECTION =====
  addPageIfNeeded(80);
  
  currentY += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, currentY, pageWidth - 15, currentY);
  currentY += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Verification & Signatures', 15, currentY);
  currentY += 10;

  // Auditor signature line
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Auditor:', 15, currentY);
  doc.line(40, currentY, 100, currentY);
  doc.text('Date:', 110, currentY);
  doc.line(125, currentY, 180, currentY);
  currentY += 15;

  // Supervisor signature line
  doc.text('Supervisor:', 15, currentY);
  doc.line(40, currentY, 100, currentY);
  doc.text('Date:', 110, currentY);
  doc.line(125, currentY, 180, currentY);
  currentY += 25;

  // ===== OFFICIAL STAMP AREA (Square dimension) =====
  const stampSize = 50; // Square dimensions
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1);
  doc.rect(pageWidth - 15 - stampSize, currentY - 15, stampSize, stampSize);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Official Stamp', pageWidth - 15 - stampSize / 2, currentY + 10, { align: 'center' });

  // Add footer to all pages with proper page numbering
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('\u00A92026 Blaqlogic Digitals. All rights reserved.', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, footerY, { align: 'right' });
  }

  return doc;
}

export async function downloadAuditReport(data: AuditReportData): Promise<void> {
  const doc = await generateAuditReportPDF(data);
  const schoolName = data.orderData.school_name?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toUpperCase() || 'SCHOOL';
  const fileName = `${schoolName}_Audit_Report.pdf`;
  doc.save(fileName);
}
