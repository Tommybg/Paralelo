import * as pdfjsLib from 'pdfjs-dist';

// Ensure the worker is properly set up
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromFile(file: File): Promise<string> {
    try {
        if (file.type === 'text/plain') {
            return await file.text();
        } else if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            
            // Extract text from each page
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                
                fullText += pageText + '\n';
            }
            
            return fullText;
        }
        
        throw new Error('Please upload a text file (.txt) or PDF file (.pdf)');
    } catch (error) {
        console.error('Error extracting text:', error);
        throw error;
    }
}