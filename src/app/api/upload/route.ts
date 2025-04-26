import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const type = formData.get('type');
        const name = formData.get('name');

        console.log('Received file:', {
            fileName: file ? (file as any).name : null,
            fileType: file ? (file as any).type : null,
            type,
            name
        });

        if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
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
        const fileBuffer = await (file as Blob).arrayBuffer();
        const fileSize = fileBuffer.byteLength;

        console.log('File processed:', {
            name: (file as any).name,
            size: fileSize,
            type: (file as any).type
        });

        // Return success response
        return NextResponse.json({
            fileUrl: `/uploads/${name}`,
            message: 'File processed successfully',
            details: {
                originalName: (file as any).name,
                size: fileSize,
                type: (file as any).type
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