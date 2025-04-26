import { NextRequest, NextResponse } from 'next/server';
import { convertToPdf } from '@/lib/document-converter';
import { extname } from 'path';

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
        const fileExtension = extname(file.name).toLowerCase();
        
        console.log('File buffer created:', {
            bufferSize: fileBuffer.length,
            fileName: file.name,
            fileType: file.type,
            fileExtension
        });

        // Convert DOC to PDF if necessary
        const pdfBuffer = await convertToPdf(fileBuffer, file.name);
        
        // If the file is not supported (not PDF, DOC, or DOCX)
        if (fileExtension !== '.pdf' && fileExtension !== '.doc' && fileExtension !== '.docx') {
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

        // If conversion was performed (for DOC files)
        if (pdfBuffer) {
            console.log('DOC file converted to PDF successfully:', {
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
                message: 'File converted and processed successfully',
                details: {
                    originalName: file.name,
                    originalType: file.type,
                    size: pdfBuffer.length,
                    type: 'application/pdf'
                },
                convertedFile: {
                    data: base64Pdf,
                    type: 'application/pdf',
                    name: file.name.replace(/\.doc$/i, '.pdf')
                }
            });
        }

        // For PDF and DOCX files that don't need conversion
        console.log('File processed without conversion:', {
            originalName: file.name,
            originalType: file.type,
            size: fileBuffer.length
        });

        // Convert the original file to base64
        const base64Data = fileBuffer.toString('base64');

        return NextResponse.json({
            fileUrl: `/uploads/${name}`,
            message: 'File processed successfully',
            details: {
                originalName: file.name,
                originalType: file.type,
                size: fileBuffer.length,
                type: file.type
            },
            convertedFile: {
                data: base64Data,
                type: file.type,
                name: file.name
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