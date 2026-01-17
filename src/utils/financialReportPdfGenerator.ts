import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatTZS } from './pricing';
import logoUrl from '@/assets/project-fusion-logo.png';

interface Transaction {
  id: string;
  external_ref: string | null;
  school_name: string | null;
  total_amount: number | null;
  status: string;
  created_at: string;
  payment_method: string | null;
}

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingTransactions: number;
  confirmedOrders: number;
  totalTransactions: number;
}

const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
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
};

export const generateTransactionsExportPdf = async (
  transactions: Transaction[],
  stats: FinancialStats
): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Load logo
  const logoBase64 = await loadImageAsBase64(logoUrl);
  
  let currentY = 15;
  
  // Header with logo
  if (logoBase64) {
    try {
      const logoHeight = 7;
      const logoWidth = 49;
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - logoWidth / 2, currentY - 3, logoWidth, logoHeight);
      currentY += logoHeight + 5;
    } catch {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('PROJECT FUSION', pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }
  }
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Transactions Export Report', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  
  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 140, 141);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;
  
  // Divider
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;
  
  // Summary Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', margin, currentY);
  currentY += 5;
  
  // Summary table
  autoTable(doc, {
    startY: currentY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Transactions', stats.totalTransactions.toString()],
      ['Total Revenue', formatTZS(stats.totalRevenue)],
      ['This Month Revenue', formatTZS(stats.monthlyRevenue)],
      ['Pending Orders', stats.pendingTransactions.toString()],
      ['Confirmed Orders', stats.confirmedOrders.toString()]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [44, 62, 80]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 60 },
      1: { halign: 'right', cellWidth: 60 }
    },
    margin: { left: margin, right: margin },
    tableWidth: 120
  });
  
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Transactions Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Transaction Details', margin, currentY);
  currentY += 5;
  
  const transactionData = transactions.map((t, index) => [
    (index + 1).toString(),
    new Date(t.created_at).toLocaleDateString('en-GB'),
    t.external_ref || t.id.slice(0, 8),
    t.school_name || 'N/A',
    formatTZS(t.total_amount || 0),
    t.status,
    t.payment_method || 'N/A'
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Order ID', 'School', 'Amount', 'Status', 'Payment Method']],
    body: transactionData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [44, 62, 80]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'left', cellWidth: 40 },
      4: { halign: 'left', cellWidth: 30 },
      5: { halign: 'center', cellWidth: 25 },
      6: { halign: 'center', cellWidth: 35 }
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        '\u00A92026 Blaqlogic Digitals. All rights reserved.',
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }
  });
  
  // Update page numbers after all pages are created
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    
    // Clear the area first
    doc.setFillColor(255, 255, 255);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      '\u00A92026 Blaqlogic Digitals. All rights reserved.',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }
  
  doc.save(`transactions_export_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateFinancialReportPdf = async (
  transactions: Transaction[],
  stats: FinancialStats
): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Load logo
  const logoBase64 = await loadImageAsBase64(logoUrl);
  
  let currentY = 15;
  
  // Header with logo
  if (logoBase64) {
    try {
      const logoHeight = 7;
      const logoWidth = 49;
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - logoWidth / 2, currentY - 3, logoWidth, logoHeight);
      currentY += logoHeight + 5;
    } catch {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('PROJECT FUSION', pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }
  }
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Financial Report', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 140, 141);
  const currentMonth = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  doc.text(`Comprehensive Financial Analysis - ${currentMonth}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  
  // Date
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;
  
  // Divider
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;
  
  // Executive Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Executive Summary', margin, currentY);
  currentY += 6;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(74, 85, 104);
  const summaryText = `This report provides a comprehensive overview of financial activities for Project Fusion. The total revenue recorded is ${formatTZS(stats.totalRevenue)} with ${stats.totalTransactions} transactions processed. This month alone has generated ${formatTZS(stats.monthlyRevenue)} in revenue with ${stats.confirmedOrders} confirmed orders.`;
  const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
  doc.text(summaryLines, margin, currentY);
  currentY += summaryLines.length * 4 + 8;
  
  // Financial Overview Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Financial Overview', margin, currentY);
  currentY += 5;
  
  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Value', 'Notes']],
    body: [
      ['Total Revenue', formatTZS(stats.totalRevenue), 'All-time earnings'],
      ['Monthly Revenue', formatTZS(stats.monthlyRevenue), 'Current month'],
      ['Average Transaction', formatTZS(stats.totalTransactions > 0 ? stats.totalRevenue / stats.totalTransactions : 0), 'Per order average'],
      ['Total Transactions', stats.totalTransactions.toString(), 'All processed orders'],
      ['Confirmed Orders', stats.confirmedOrders.toString(), 'This month'],
      ['Pending Orders', stats.pendingTransactions.toString(), 'Awaiting verification']
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [44, 62, 80]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 50 },
      2: { halign: 'left', cellWidth: 60 }
    },
    margin: { left: margin, right: margin }
  });
  
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Status Breakdown
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Order Status Distribution', margin, currentY);
  currentY += 5;
  
  const statusCounts: { [key: string]: { count: number; amount: number } } = {};
  transactions.forEach(t => {
    if (!statusCounts[t.status]) {
      statusCounts[t.status] = { count: 0, amount: 0 };
    }
    statusCounts[t.status].count++;
    statusCounts[t.status].amount += t.total_amount || 0;
  });
  
  const statusData = Object.entries(statusCounts).map(([status, data]) => [
    status,
    data.count.toString(),
    formatTZS(data.amount),
    `${((data.count / stats.totalTransactions) * 100).toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Status', 'Count', 'Total Amount', 'Percentage']],
    body: statusData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [44, 62, 80]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 40 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 50 },
      3: { halign: 'center', cellWidth: 30 }
    },
    margin: { left: margin, right: margin }
  });
  
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Payment Method Breakdown
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Payment Method Analysis', margin, currentY);
  currentY += 5;
  
  const paymentCounts: { [key: string]: { count: number; amount: number } } = {};
  transactions.forEach(t => {
    const method = t.payment_method || 'Unspecified';
    if (!paymentCounts[method]) {
      paymentCounts[method] = { count: 0, amount: 0 };
    }
    paymentCounts[method].count++;
    paymentCounts[method].amount += t.total_amount || 0;
  });
  
  const paymentData = Object.entries(paymentCounts).map(([method, data]) => [
    method,
    data.count.toString(),
    formatTZS(data.amount),
    `${((data.count / stats.totalTransactions) * 100).toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Payment Method', 'Transactions', 'Total Amount', 'Usage %']],
    body: paymentData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [44, 62, 80]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 45 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'center', cellWidth: 30 }
    },
    margin: { left: margin, right: margin }
  });
  
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Top Schools
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Top Contributing Schools', margin, currentY);
  currentY += 5;
  
  const schoolTotals: { [key: string]: { count: number; amount: number } } = {};
  transactions.forEach(t => {
    const school = t.school_name || 'Unknown';
    if (!schoolTotals[school]) {
      schoolTotals[school] = { count: 0, amount: 0 };
    }
    schoolTotals[school].count++;
    schoolTotals[school].amount += t.total_amount || 0;
  });
  
  const topSchools = Object.entries(schoolTotals)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10)
    .map(([school, data], index) => [
      (index + 1).toString(),
      school,
      data.count.toString(),
      formatTZS(data.amount)
    ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Rank', 'School Name', 'Orders', 'Total Revenue']],
    body: topSchools,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [44, 62, 80]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 80 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 40 }
    },
    margin: { left: margin, right: margin }
  });
  
  // Update page numbers after all pages are created
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    
    // Clear the footer area
    doc.setFillColor(255, 255, 255);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      '\u00A92026 Blaqlogic Digitals. All rights reserved.',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }
  
  doc.save(`financial_report_${new Date().toISOString().split('T')[0]}.pdf`);
};
