import { BaseAgent } from './BaseAgent';
/**
 * PDFAgent — AI skill agent for PDF operations.
 *
 * Tools registered:
 *   pdf_merge         — merge multiple PDF files into one
 *   pdf_extract_text  — extract raw text from a PDF
 *   pdf_info          — return page count and metadata
 */
export declare class PDFAgent extends BaseAgent {
    name: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    init(): Promise<void>;
    process(task: string): Promise<string>;
}
//# sourceMappingURL=PDFAgent.d.ts.map