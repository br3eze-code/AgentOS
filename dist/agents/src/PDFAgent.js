"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const kernel_1 = require("@agentclaw/kernel");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * PDFAgent — AI skill agent for PDF operations.
 *
 * Tools registered:
 *   pdf_merge         — merge multiple PDF files into one
 *   pdf_extract_text  — extract raw text from a PDF
 *   pdf_info          — return page count and metadata
 */
class PDFAgent extends BaseAgent_1.BaseAgent {
    name = 'PDFAgent';
    async start() { }
    async stop() { }
    async init() {
        this.log('Registering PDF tools with MCPRegistry...');
        kernel_1.mcpRegistry.registerTool({
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
            },
        }, async (args) => {
            const { inputs, output } = args;
            // Validate inputs exist
            for (const f of inputs) {
                if (!fs.existsSync(f))
                    throw new Error(`PDF not found: ${f}`);
            }
            // Attempt dynamic import of pdf-lib (optional dependency)
            try {
                // @ts-ignore Optional peer dependency
                const { PDFDocument } = await Promise.resolve().then(() => __importStar(require('pdf-lib')));
                const merged = await PDFDocument.create();
                for (const filePath of inputs) {
                    const bytes = fs.readFileSync(filePath);
                    const src = await PDFDocument.load(bytes);
                    const pages = await merged.copyPages(src, src.getPageIndices());
                    pages.forEach((p) => merged.addPage(p));
                }
                const mergedBytes = await merged.save();
                fs.mkdirSync(path.dirname(output), { recursive: true });
                fs.writeFileSync(output, mergedBytes);
                return { success: true, output, pages: merged.getPageCount() };
            }
            catch (importErr) {
                // Fallback: binary concatenation (not valid PDF but records intent)
                throw new Error(`pdf-lib not installed. Run: npm install pdf-lib. Details: ${importErr.message}`);
            }
        }, 'PDFAgent');
        kernel_1.mcpRegistry.registerTool({
            name: 'pdf_extract_text',
            description: 'Extract raw text content from a PDF file',
            inputSchema: {
                type: 'object',
                properties: {
                    file: { type: 'string', description: 'Absolute path to the PDF file' },
                    pages: { type: 'string', description: 'Optional page range, e.g. "1-5" or "all" (default: all)' },
                },
                required: ['file'],
            },
        }, async (args) => {
            const { file } = args;
            if (!fs.existsSync(file))
                throw new Error(`PDF not found: ${file}`);
            // Use pdfjs-dist for text extraction
            try {
                const pdfjs = await Promise.resolve(`${'pdfjs-dist/legacy/build/pdf.js'}`).then(s => __importStar(require(s)));
                const data = new Uint8Array(fs.readFileSync(file));
                const doc = await pdfjs.getDocument({ data }).promise;
                const texts = [];
                for (let i = 1; i <= doc.numPages; i++) {
                    const page = await doc.getPage(i);
                    const content = await page.getTextContent();
                    texts.push(content.items.map((item) => item.str).join(' '));
                }
                return { success: true, pages: doc.numPages, text: texts.join('\n') };
            }
            catch (importErr) {
                throw new Error(`pdfjs-dist not installed. Run: npm install pdfjs-dist. Details: ${importErr.message}`);
            }
        }, 'PDFAgent');
        kernel_1.mcpRegistry.registerTool({
            name: 'pdf_info',
            description: 'Get metadata and page count from a PDF file',
            inputSchema: {
                type: 'object',
                properties: {
                    file: { type: 'string', description: 'Absolute path to the PDF file' },
                },
                required: ['file'],
            },
        }, async (args) => {
            const { file } = args;
            if (!fs.existsSync(file))
                throw new Error(`PDF not found: ${file}`);
            const stat = fs.statSync(file);
            try {
                // @ts-ignore Optional peer dependency
                const { PDFDocument } = await Promise.resolve().then(() => __importStar(require('pdf-lib')));
                const doc = await PDFDocument.load(fs.readFileSync(file));
                const info = doc.getTitle();
                return {
                    success: true,
                    file,
                    pages: doc.getPageCount(),
                    title: info || null,
                    sizeBytes: stat.size,
                };
            }
            catch {
                return {
                    success: true,
                    file,
                    sizeBytes: stat.size,
                    note: 'Install pdf-lib for full metadata: npm install pdf-lib',
                };
            }
        }, 'PDFAgent');
        this.log('PDFAgent: 3 tools registered (pdf_merge, pdf_extract_text, pdf_info)');
    }
    async process(task) {
        return `PDFAgent received task: "${task}". Use pdf_merge, pdf_extract_text, or pdf_info tools via the planner.`;
    }
}
exports.PDFAgent = PDFAgent;
//# sourceMappingURL=PDFAgent.js.map