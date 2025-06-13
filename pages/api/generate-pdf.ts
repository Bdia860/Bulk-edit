// pages/api/generate-pdf.ts

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Increase payload size limit
    },
  },
};
import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import fs from 'fs/promises'; // For async file operations
import path from 'path';
import os from 'os'; // For temporary directory

// Define expected request body structure
interface PdfRequestData {
  htmlContent: string;
  headerHtml?: string;
  footerHtml?: string;
  cssStyles?: string;
  margins?: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  options?: Record<string, string | boolean>; // Additional wkhtmltopdf options
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    htmlContent: originalHtmlContent,
    headerHtml = '',
    footerHtml = '',
    cssStyles = '',
    margins = { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }, // Default to 0mm margins
    options = {} // e.g., { 'orientation': 'Landscape' }
  }: PdfRequestData = req.body;

  // Force a default font-family for the body, which can be overridden by more specific user styles.
  const finalCssStyles = `
    body { font-family: Arial, sans-serif; }
    ${cssStyles}
  `;

  // Process htmlContent for custom page breaks
  const htmlContent = originalHtmlContent.replace(/\[SAUT_PAGE\]/g, '<div style="page-break-after: always;"></div>');

  if (!htmlContent) {
    return res.status(400).json({ error: 'htmlContent is required' });
  }

  let tempDir: string | null = null;
  try {
    // 1. Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdfgen-'));

    // 2. Prepare files and wkhtmltopdf command arguments
    const mainHtmlPath = path.join(tempDir, 'main.html');
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>${finalCssStyles}</style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>`;
    await fs.writeFile(mainHtmlPath, fullHtml);

    const pdfOutputPath = path.join(tempDir, 'output.pdf');
    let command = `wkhtmltopdf --enable-local-file-access --encoding UTF-8 --enable-javascript`;

    // Add global options
    Object.entries(options).forEach(([key, value]) => {
      command += ` --${key}`;
      if (typeof value === 'string') {
        command += ` "${value}"`;
      }
    });

    // Add margins
    command += ` --margin-top "${margins.top}" --margin-bottom "${margins.bottom}" --margin-left "${margins.left}" --margin-right "${margins.right}"`;

    // Add header and footer if provided
    if (headerHtml) {
      const headerHtmlPath = path.join(tempDir, 'header.html');
      const processedHeaderHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${finalCssStyles}</style></head><body><div class="header">${headerHtml}</div></body></html>`;
      await fs.writeFile(headerHtmlPath, processedHeaderHtml);
      command += ` --header-html "${headerHtmlPath}"`;
    }
    if (footerHtml) {
      const footerHtmlPath = path.join(tempDir, 'footer.html');
      const processedFooterHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${finalCssStyles}</style></head><body><div class="footer">${footerHtml}</div></body></html>`;
      await fs.writeFile(footerHtmlPath, processedFooterHtml);
      command += ` --footer-html "${footerHtmlPath}"`;
    }

    // Add input and output files
    command += ` "${mainHtmlPath}" "${pdfOutputPath}"`;

    // 3. Execute wkhtmltopdf
    await new Promise<void>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`wkhtmltopdf error: ${error.message}`);
          console.error(`wkhtmltopdf stderr: ${stderr}`);
          reject(new Error(`Failed to generate PDF: ${stderr || error.message}`));
          return;
        }
        if (stderr) {
            // wkhtmltopdf sometimes outputs warnings to stderr even on success
            console.warn(`wkhtmltopdf stderr (warnings): ${stderr}`);
        }
        resolve();
      });
    });

    // 4. Read the generated PDF and send it back
    const pdfBuffer = await fs.readFile(pdfOutputPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="generated.pdf"'); // Or 'inline'
    res.status(200).send(pdfBuffer);

  } catch (error: any) {
    console.error('PDF generation failed:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  } finally {
    // 5. Clean up temporary directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Failed to cleanup temporary directory:', cleanupError);
      }
    }
  }
}
