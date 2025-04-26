import { NextRequest, NextResponse } from 'next/server';
import * as mammoth from 'mammoth';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await mammoth.convertToHtml({
            buffer: buffer
        });

        return NextResponse.json({
            content: result.value,
            messages: result.messages
        });
    } catch (error) {
        console.error('Error converting document:', error);
        return NextResponse.json(
            { error: 'Error converting document' },
            { status: 500 }
        );
    }
} 