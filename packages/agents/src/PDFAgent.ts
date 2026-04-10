import { BaseAgent } from './BaseAgent';
import { mcpRegistry } from '@agentclaw/kernel';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PDFAgent — AI skill agent for PDF operations.
 *
 * Tools registered:
 *   pdf_merge         — merge multiple PDF files into one
 *   pdf_extract_text  — extract raw text from a PDF
 *   pdf_info          — return page count and metadata
 */
export class PDFAgent extends BaseAgent {
  name = 'PDFAgent';

  async start(): Promise<void> {}
  async stop(): Promise<void> {}

  async init(): Promise<void> {
    this.log('Registering PDF tools with MCPRegistry...');

    mcpRegistry.registerTool(
      {
        name: 'pdf_merge',
        description: 'Merge multiple PDF files into a single output PDF',
        inputSchema: {
          type: 'object',
          properties: {
            inputs: {
              type: 'array',
              description: 'Absolute paths to the input PDF files',
            },
            output: {
              type: 'string',
              description: 'Absolute path for the merged output PDF',
            },
          },
          required: ['inputs', 'output'],
        } as any,
      },
      async (args) => {
        const { inputs, output } = args as { inputs: string[]; output: string };

        // Validate inputs exist
        for (const f of inputs) {
          if (!fs.existsSync(f)) throw new Error(`PDF not found: ${f}`);
        }

        // Attempt dynamic import of pdf-lib (optional dependency)
        try {
          // @ts-ignore Optional peer dependency
          const { PDFDocument } = await import('pdf-lib');
          const merged = await PDFDocument.create();

          for (const filePath of inputs) {
            const bytes = fs.readFileSync(filePath);
            const src = await PDFDocument.load(bytes);
            const pages = await merged.copyPages(src, src.getPageIndices());
            pages.forEach((p: any) => merged.addPage(p));
          }

          const mergedBytes = await merged.save();
          fs.mkdirSync(path.dirname(output), { recursive: true });
          fs.writeFileSync(output, mergedBytes);

          return { success: true, output, pages: merged.getPageCount() };
        } catch (importErr: any) {
          // Fallback: binary concatenation (not valid PDF but records intent)
          throw new Error(`pdf-lib not installed. Run: npm install pdf-lib. Details: ${importErr.message}`);
        }
      },
      'PDFAgent'
    );

    mcpRegistry.registerTool(
      {
        name: 'pdf_extract_text',
        description: 'Extract raw text content from a PDF file',
        inputSchema: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'Absolute path to the PDF file' },
            pages: { type: 'string', description: 'Optional page range, e.g. "1-5" or "all" (default: all)' },
          },
          required: ['file'],
        } as any,
      },
      async (args) => {
        const { file } = args as { file: string };
        if (!fs.existsSync(file)) throw new Error(`PDF not found: ${file}`);

        // Use pdfjs-dist for text extraction
        try {
          const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js' as any);
          const data = new Uint8Array(fs.readFileSync(file));
          const doc = await pdfjs.getDocument({ data }).promise;
          const texts: string[] = [];

          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            texts.push(content.items.map((item: any) => item.str).join(' '));
          }

          return { success: true, pages: doc.numPages, text: texts.join('\n') };
        } catch (importErr: any) {
          throw new Error(`pdfjs-dist not installed. Run: npm install pdfjs-dist. Details: ${importErr.message}`);
        }
      },
      'PDFAgent'
    );

    mcpRegistry.registerTool(
      {
        name: 'pdf_info',
        description: 'Get metadata and page count from a PDF file',
        inputSchema: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'Absolute path to the PDF file' },
          },
          required: ['file'],
        },
      },
      async (args) => {
        const { file } = args as { file: string };
        if (!fs.existsSync(file)) throw new Error(`PDF not found: ${file}`);

        const stat = fs.statSync(file);
        try {
          // @ts-ignore Optional peer dependency
          const { PDFDocument } = await import('pdf-lib');
          const doc = await PDFDocument.load(fs.readFileSync(file));
          const info = doc.getTitle();
          return {
            success: true,
            file,
            pages: doc.getPageCount(),
            title: info || null,
            sizeBytes: stat.size,
          };
        } catch {
          return {
            success: true,
            file,
            sizeBytes: stat.size,
            note: 'Install pdf-lib for full metadata: npm install pdf-lib',
          };
        }
      },
      'PDFAgent'
    );

    this.log('PDFAgent: 3 tools registered (pdf_merge, pdf_extract_text, pdf_info)');
  }

  async process(task: string): Promise<string> {
    return `PDFAgent received task: "${task}". Use pdf_merge, pdf_extract_text, or pdf_info tools via the planner.`;
  }
}
