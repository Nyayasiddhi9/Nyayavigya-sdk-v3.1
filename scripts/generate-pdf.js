const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  console.log('Starting PDF generation...');
  
  const htmlPath = path.resolve('./WAI_SDK_V1.0_PRODUCT_DOCUMENTATION.html');
  const pdfPath = path.resolve('./WAI_SDK_V1.0_PRODUCT_DOCUMENTATION.pdf');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }
  
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/x205pbkd5xh5g4iv0g58xjla55has3cx-chromium-108.0.5359.94/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WAI SDK v1.0 Product Documentation</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      margin: 0;
      padding: 40px 60px;
      font-size: 11px;
    }
    h1 {
      color: #1a1a2e;
      border-bottom: 3px solid #4a69bd;
      padding-bottom: 10px;
      font-size: 28px;
      page-break-before: always;
    }
    h1:first-of-type {
      page-break-before: avoid;
    }
    h2 {
      color: #2d3436;
      border-bottom: 2px solid #74b9ff;
      padding-bottom: 8px;
      margin-top: 30px;
      font-size: 18px;
    }
    h3 {
      color: #4a4a4a;
      margin-top: 20px;
      font-size: 14px;
    }
    h4 {
      color: #555;
      font-size: 12px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 15px 0;
      font-size: 10px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #4a69bd;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #e9ecef;
    }
    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Consolas', monospace;
      font-size: 10px;
    }
    pre {
      background-color: #2d3436;
      color: #dfe6e9;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      font-size: 10px;
    }
    blockquote {
      border-left: 4px solid #4a69bd;
      margin: 15px 0;
      padding: 10px 20px;
      background-color: #f8f9fa;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    li {
      margin: 5px 0;
    }
    hr {
      border: none;
      border-top: 2px solid #eee;
      margin: 30px 0;
    }
    .cover-page {
      text-align: center;
      padding: 100px 0;
    }
    .cover-title {
      font-size: 48px;
      color: #1a1a2e;
      margin-bottom: 20px;
    }
    .cover-subtitle {
      font-size: 24px;
      color: #4a69bd;
      margin-bottom: 40px;
    }
    .cover-version {
      font-size: 18px;
      color: #666;
    }
    @page {
      margin: 1cm;
      @bottom-center {
        content: counter(page);
      }
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="cover-title">WAI SDK v1.0</div>
    <div class="cover-subtitle">Complete Product Documentation</div>
    <div class="cover-version">Version 1.0.0 | December 2025</div>
    <br><br>
    <p>Enterprise-Grade AI Orchestration Platform</p>
    <p>267 Autonomous Agents | 23+ LLM Providers | 530+ MCP Tools</p>
  </div>
  ${htmlContent}
</body>
</html>
    `;
    
    await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size:8px; width:100%; text-align:center; color:#999;">WAI SDK v1.0 Product Documentation</div>',
      footerTemplate: '<div style="font-size:8px; width:100%; text-align:center; color:#999;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });
    
    console.log('PDF generated successfully:', pdfPath);
    console.log('File size:', (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2), 'MB');
    
  } catch (error) {
    console.error('Error generating PDF:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

generatePDF();
