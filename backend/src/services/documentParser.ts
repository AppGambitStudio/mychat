const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';
import path from 'path';

const turndownService = new TurndownService();

export const parseDocument = async (file: Express.Multer.File): Promise<string> => {
    const ext = path.extname(file.originalname).toLowerCase();

    try {
        switch (ext) {
            case '.pdf':
                const pdfData = await pdfParse(file.buffer);
                return pdfData.text;

            case '.docx':
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                return result.value;

            case '.html':
                const htmlContent = file.buffer.toString('utf-8');
                // Optional: Use cheerio to clean up HTML before converting?
                // For now, just convert directly to markdown for better RAG chunking
                return turndownService.turndown(htmlContent);

            case '.txt':
            case '.md':
                return file.buffer.toString('utf-8');

            default:
                throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (error) {
        console.error(`Error parsing file ${file.originalname}:`, error);
        throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
