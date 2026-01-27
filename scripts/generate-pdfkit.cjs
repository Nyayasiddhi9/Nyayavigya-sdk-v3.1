const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COLORS = {
  primary: '#1a1a2e',
  secondary: '#4a69bd',
  accent: '#74b9ff',
  text: '#333333',
  lightText: '#666666',
  tableHeader: '#4a69bd',
  tableRowEven: '#f8f9fa',
  tableBorder: '#dddddd'
};

function generatePDF() {
  console.log('Starting PDF generation with PDFKit...');
  
  const mdPath = path.resolve('./WAI_SDK_V1.0_PRODUCT_DOCUMENTATION.md');
  const pdfPath = path.resolve('./WAI_SDK_V1.0_PRODUCT_DOCUMENTATION.pdf');
  
  if (!fs.existsSync(mdPath)) {
    console.error('Markdown file not found:', mdPath);
    process.exit(1);
  }
  
  const content = fs.readFileSync(mdPath, 'utf8');
  
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: 'WAI SDK v1.0 Product Documentation',
      Author: 'WAI SDK Team',
      Subject: 'Enterprise AI Orchestration Platform',
      Keywords: 'AI, SDK, orchestration, agents, LLM',
      CreationDate: new Date(),
      ModDate: new Date()
    }
  });
  
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);
  
  // Cover Page
  doc.fontSize(48).fillColor(COLORS.primary).text('WAI SDK v1.0', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(24).fillColor(COLORS.secondary).text('Complete Product Documentation', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(16).fillColor(COLORS.lightText).text('Version 1.0.0 | December 2025', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(14).fillColor(COLORS.text).text('Enterprise-Grade AI Orchestration Platform', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor(COLORS.lightText);
  doc.text('267 Autonomous Agents | 23+ LLM Providers | 530+ MCP Tools', { align: 'center' });
  doc.text('7 Integrated Protocols | Multimodal Capabilities', { align: 'center' });
  doc.moveDown(4);
  doc.fontSize(10).fillColor('#999999').text('Confidential Product Documentation', { align: 'center' });
  
  doc.addPage();
  
  // Process markdown content
  const lines = content.split('\n');
  let inTable = false;
  let tableData = [];
  let inCodeBlock = false;
  let codeContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip first line (title already on cover)
    if (i === 0 && line.startsWith('# WAI SDK')) continue;
    
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        doc.fontSize(9).fillColor('#dfe6e9');
        const codeRect = { x: 50, y: doc.y, width: 495, padding: 10 };
        doc.rect(codeRect.x, codeRect.y, codeRect.width, Math.max(codeContent.split('\n').length * 12 + 20, 40))
           .fill('#2d3436');
        doc.y = codeRect.y + 10;
        doc.x = 60;
        doc.font('Courier').text(codeContent.trim(), 60, doc.y, { width: 475 });
        doc.font('Helvetica');
        doc.moveDown();
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }
    
    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableData = [];
      }
      // Skip separator lines
      if (line.includes('---')) continue;
      
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      tableData.push(cells);
      continue;
    } else if (inTable && tableData.length > 0) {
      // End of table, render it
      renderTable(doc, tableData);
      tableData = [];
      inTable = false;
    }
    
    // Headers
    if (line.startsWith('# ')) {
      if (doc.y > 100) doc.addPage();
      doc.fontSize(24).fillColor(COLORS.primary);
      doc.text(line.replace('# ', '').replace(/\*\*/g, ''), { underline: false });
      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke(COLORS.secondary);
      doc.moveDown(0.5);
    } else if (line.startsWith('## ')) {
      doc.moveDown(0.5);
      if (doc.y > 700) doc.addPage();
      doc.fontSize(18).fillColor(COLORS.primary);
      doc.text(line.replace('## ', '').replace(/\*\*/g, ''));
      doc.moveTo(50, doc.y + 3).lineTo(400, doc.y + 3).stroke(COLORS.accent);
      doc.moveDown(0.3);
    } else if (line.startsWith('### ')) {
      if (doc.y > 720) doc.addPage();
      doc.fontSize(14).fillColor(COLORS.primary);
      doc.text(line.replace('### ', '').replace(/\*\*/g, ''), { continued: false });
      doc.moveDown(0.2);
    } else if (line.startsWith('#### ')) {
      if (doc.y > 730) doc.addPage();
      doc.fontSize(12).fillColor(COLORS.text);
      doc.text(line.replace('#### ', '').replace(/\*\*/g, ''), { bold: true });
      doc.moveDown(0.1);
    } else if (line.startsWith('- ')) {
      // Bullet points
      doc.fontSize(10).fillColor(COLORS.text);
      const bulletText = line.replace('- ', '').replace(/\*\*/g, '').replace(/`/g, '');
      doc.text('• ' + bulletText, { indent: 20 });
    } else if (line.startsWith('| #')) {
      // Skip numbered table headers - handled in table rendering
    } else if (line.trim() === '---') {
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#eeeeee');
      doc.moveDown(0.5);
    } else if (line.trim()) {
      // Regular paragraph
      doc.fontSize(10).fillColor(COLORS.text);
      const cleanLine = line.replace(/\*\*/g, '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      if (cleanLine.trim()) {
        doc.text(cleanLine, { align: 'justify' });
      }
    }
    
    // Check for page break
    if (doc.y > 750) {
      doc.addPage();
    }
  }
  
  // Render any remaining table
  if (tableData.length > 0) {
    renderTable(doc, tableData);
  }
  
  // Add page numbers
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#999999');
    doc.text(`Page ${i + 1} of ${pages.count} | WAI SDK v1.0 Product Documentation`, 
             50, doc.page.height - 30, { align: 'center', width: 495 });
  }
  
  doc.end();
  
  stream.on('finish', () => {
    const stats = fs.statSync(pdfPath);
    console.log('PDF generated successfully:', pdfPath);
    console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Pages: ~' + pages.count);
  });
}

function renderTable(doc, tableData) {
  if (tableData.length === 0) return;
  
  const startY = doc.y;
  const colCount = tableData[0].length;
  const tableWidth = 495;
  const colWidth = tableWidth / colCount;
  const rowHeight = 20;
  const headerHeight = 25;
  
  // Check if table fits on page
  const tableHeight = headerHeight + (tableData.length - 1) * rowHeight;
  if (startY + tableHeight > 750) {
    doc.addPage();
  }
  
  let y = doc.y;
  
  // Header row
  if (tableData[0]) {
    doc.rect(50, y, tableWidth, headerHeight).fill(COLORS.tableHeader);
    doc.fontSize(9).fillColor('white');
    tableData[0].forEach((cell, j) => {
      doc.text(cell.substring(0, 40), 55 + j * colWidth, y + 7, { 
        width: colWidth - 10, 
        align: 'left'
      });
    });
    y += headerHeight;
  }
  
  // Data rows
  for (let i = 1; i < tableData.length && i < 50; i++) { // Limit rows to prevent huge tables
    const row = tableData[i];
    const isEven = i % 2 === 0;
    
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
    
    if (isEven) {
      doc.rect(50, y, tableWidth, rowHeight).fill(COLORS.tableRowEven);
    }
    
    doc.rect(50, y, tableWidth, rowHeight).stroke(COLORS.tableBorder);
    
    doc.fontSize(8).fillColor(COLORS.text);
    row.forEach((cell, j) => {
      const cellText = (cell || '').substring(0, 50);
      doc.text(cellText, 55 + j * colWidth, y + 5, { 
        width: colWidth - 10, 
        align: 'left'
      });
    });
    
    y += rowHeight;
  }
  
  doc.y = y + 10;
  doc.moveDown(0.5);
}

try {
  generatePDF();
} catch (error) {
  console.error('Error generating PDF:', error);
  process.exit(1);
}
