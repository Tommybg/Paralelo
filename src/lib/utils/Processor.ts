import type { PDFDocumentProxy, TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Placeholder for pdfjs-dist imports, will be populated by dynamic import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getDocument: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GlobalWorkerOptions: any = null; // Using any for simplicity with dynamic import

export async function extractTextFromFile(file: File): Promise<string> {
    if (typeof window !== 'undefined') { // Ensure this runs only on the client-side
        if (!getDocument || !GlobalWorkerOptions) {
            // Using .mjs as per directory listing. Preferring minified version.
            const pdfjs = await import('pdfjs-dist/legacy/build/pdf.min.mjs'); 
            getDocument = pdfjs.getDocument;
            GlobalWorkerOptions = pdfjs.GlobalWorkerOptions;
            // Ensure `pdf.worker.legacy.min.mjs` is copied to your `public` folder.
            // For example, from `node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs`
            GlobalWorkerOptions.workerSrc = '/pdf.worker.legacy.min.mjs';
        }

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
                    textContent += text.items.map((item: TextItem | TextMarkedContent): string => {
                        if ('str' in item) {
                            return item.str;
                        }
                        return '';
                    }).join(' ');
                    textContent += '\\n'; // Add a newline character after each page
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
    } else {
        console.warn('extractTextFromFile called on server side. PDF processing is client-side only.');
        if (file.type === 'application/pdf') {
            return Promise.reject(new Error('PDF processing is not available during server-side rendering.'));
        } else if (file.type === 'text/plain') {
            return file.text(); 
        }
        return Promise.reject(new Error('File processing called on server for unsupported type.'));
    }
}