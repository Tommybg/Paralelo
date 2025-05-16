import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';

// Ensure `pdf.worker.min.mjs` is copied to your `public` folder.
// For example, from `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export async function extractTextFromFile(file: File): Promise<string> {
    try {
        if (file.type === 'text/plain') {
            return await file.text();
        } else if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf: PDFDocumentProxy = await getDocument({ data: arrayBuffer }).promise;
            let textContent = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                textContent += text.items.map((item): string => ('str' in item ? (item as TextItem).str : '')).join(' ');
                textContent += '\n'; // Add a newline character after each page
            }
            return textContent.trim();
        }
        
        throw new Error('Unsupported file type. Please upload a text (.txt) or PDF (.pdf) file.');
    } catch (error) {
        console.error('Error extracting text:', error);
        if (error instanceof Error) {
            throw new Error(`Error processing file: ${error.message}`);
        }
        throw new Error('An unknown error occurred while processing the file.');
    }
}