declare module 'pdfjs-dist/legacy/build/pdf.min.mjs' {
    // You can try to be more specific here if you know the structure,
    // or import types from 'pdfjs-dist/types/src/display/api' and re-export them.
    // For now, a simple 'any' will satisfy TypeScript for the module itself.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs: any; // Or be more specific e.g., { getDocument: any, GlobalWorkerOptions: any, ... }
    export = pdfjs;
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.min.mjs' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const worker: any; // Similarly, can be more specific if needed
    export = worker;
} 