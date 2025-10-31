import { PDFDocument } from 'pdf-lib';
import { PageRange } from '@/types';

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const fileBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

export async function splitPDF(
  file: File,
  ranges: PageRange[]
): Promise<Uint8Array[]> {
  const fileBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const splitPdfs: Uint8Array[] = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const pageIndices = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start + i - 1
    );
    
    // Copy pages in batches for better performance
    const pages = await newPdf.copyPages(pdf, pageIndices);
    pages.forEach((page) => newPdf.addPage(page));
    
    // Use compression for smaller file sizes
    const pdfBytes = await newPdf.save({
      useObjectStreams: false, // Better compatibility
    });
    splitPdfs.push(pdfBytes);
  }

  return splitPdfs;
}

export async function splitPDFIntoIndividual(file: File): Promise<Uint8Array[]> {
  const fileBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const pageCount = pdf.getPageCount();
  const splitPdfs: Uint8Array[] = [];

  // Process in chunks to avoid memory issues
  const chunkSize = 10;
  for (let i = 0; i < pageCount; i += chunkSize) {
    const end = Math.min(i + chunkSize, pageCount);
    
    for (let j = i; j < end; j++) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdf, [j]);
      newPdf.addPage(page);
      
      const pdfBytes = await newPdf.save({
        useObjectStreams: false,
      });
      splitPdfs.push(pdfBytes);
    }
    
    // Allow garbage collection between chunks
    if (end < pageCount) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return splitPdfs;
}

export async function getPDFPageCount(file: File): Promise<number> {
  try {
    const fileBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBuffer, { 
      ignoreEncryption: true,
      throwOnInvalidObject: false 
    });
    return pdf.getPageCount();
  } catch (error) {
    console.error('Error getting page count:', error);
    throw new Error('Failed to load PDF. The file may be corrupted or password-protected.');
  }
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  try {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup with a delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF');
  }
}

// Helper function to estimate memory usage
export function estimatePDFMemoryUsage(fileSize: number, pageCount: number): number {
  // Rough estimate: file size * 3 (for processing overhead)
  return (fileSize * 3) / (1024 * 1024); // Return in MB
}

// Check if browser can handle the PDF size
export function canHandlePDFSize(fileSize: number): boolean {
  const fileSizeMB = fileSize / (1024 * 1024);
  
  // Conservative limits for browser processing
  if (fileSizeMB > 100) return false;
  if (fileSizeMB > 50) {
    console.warn('Large PDF file. Processing may be slow.');
  }
  
  return true;
}