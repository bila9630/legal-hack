import { promisify } from 'util';
import libre from 'libreoffice-convert';
import { extname } from 'path';

const libreConvert = promisify(libre.convert);

export async function convertToPdf(buffer: Buffer, originalFilename: string): Promise<Buffer | null> {
    const ext = extname(originalFilename).toLowerCase();
    
    console.log('Document conversion - File details:', {
        originalFilename,
        extension: ext,
        bufferSize: buffer.length,
        mimeStart: buffer.slice(0, 20).toString('hex') // Log start of file for mime type checking
    });
    
    // If it's already a PDF or DOCX, return null to indicate no conversion needed
    if (ext === '.pdf' || ext === '.docx') {
        console.log('File is PDF or DOCX, no conversion needed');
        return null;
    }
    
    // Only convert doc files
    if (ext !== '.doc') {
        console.log('Unsupported file extension:', ext);
        return null;
    }

    try {
        console.log('Starting document conversion to PDF...');
        // Convert to PDF format with explicit format options
        const pdfBuffer = await libreConvert(buffer, '.pdf', undefined);
        console.log('Document conversion successful, PDF size:', pdfBuffer.length);
        return pdfBuffer;
    } catch (error) {
        console.error('Error converting document:', error);
        throw new Error(`Failed to convert document to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
} 