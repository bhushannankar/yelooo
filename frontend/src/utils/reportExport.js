import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Trigger file download from blob
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export data to CSV format
 * @param {Array<Object>} data - Array of row objects
 * @param {string} filename - File name without extension
 */
export const exportToCSV = (data, filename = 'report') => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = val == null ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','))
  ];
  const csv = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${filename}.csv`);
};

/**
 * Export data to XLSX format
 * @param {Array<Object>} data - Array of row objects
 * @param {string} filename - File name without extension
 * @param {string} sheetName - Worksheet name
 */
export const exportToXLSX = (data, filename = 'report', sheetName = 'Report') => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Export data to XLS format (Excel 97-2003)
 * @param {Array<Object>} data - Array of row objects
 * @param {string} filename - File name without extension
 * @param {string} sheetName - Worksheet name
 */
export const exportToXLS = (data, filename = 'report', sheetName = 'Report') => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, `${filename}.xls`, { bookType: 'xls' });
};

/**
 * Export data to PDF format (table)
 * @param {Array<Object>} data - Array of row objects
 * @param {string} filename - File name without extension
 * @param {string} title - Report title
 */
export const exportToPDF = (data, filename = 'report', title = 'Report') => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h] ?? ''));
  const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  });
  doc.save(`${filename}.pdf`);
};
