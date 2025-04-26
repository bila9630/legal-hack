import { NextRequest, NextResponse } from 'next/server';
import { convertToPdf } from '@/lib/document-converter';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type');
        const name = formData.get('name');

        // Enhanced logging for debugging
        console.log('Received file details:', {
            fileName: file?.name,
            fileType: file?.type,
            fileSize: file?.size,
            formDataType: type,
            formDataName: name
        });

        if (!file || !('arrayBuffer' in file)) {
            return NextResponse.json(
                { error: 'Invalid file' },
                { status: 400 }
            );
        }

        if (!type || !name) {
            return NextResponse.json(
                { error: 'Missing type or name' },
                { status: 400 }
            );
        }

        // Process the file
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        
        console.log('File buffer created:', {
            bufferSize: fileBuffer.length,
            fileName: file.name,
            fileType: file.type
        });

        // Convert DOC/DOCX to PDF if necessary
        const pdfBuffer = await convertToPdf(fileBuffer, file.name);
        
        if (!pdfBuffer) {
            return NextResponse.json(
                { 
                    error: 'Unsupported file format',
                    details: {
                        fileName: file.name,
                        fileType: file.type,
                        acceptedFormats: ['.pdf', '.doc', '.docx']
                    }
                },
                { status: 400 }
            );
        }

        console.log('File processed successfully:', {
            originalName: file.name,
            originalType: file.type,
            pdfSize: pdfBuffer.length,
            finalType: 'application/pdf'
        });

        // Convert the buffer to base64 for transmission
        const base64Pdf = pdfBuffer.toString('base64');

        // Return success response with the converted PDF data
        return NextResponse.json({
            fileUrl: `/uploads/${name}`,
            message: 'File processed successfully',
            details: {
                originalName: file.name,
                originalType: file.type,
                size: pdfBuffer.length,
                type: 'application/pdf'
            },
            convertedFile: {
                data: base64Pdf,
                type: 'application/pdf',
                name: file.name.replace(/\.(doc|docx)$/i, '.pdf')
            }
        });
    } catch (error) {
        console.error('Error processing file:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process file',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 