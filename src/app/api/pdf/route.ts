import { NextResponse } from 'next/server';
import { loadPdf } from '@/lib/pdf-loader';

export async function POST(request: Request) {
    try {
        const { filePath } = await request.json();

        if (!filePath) {
            return NextResponse.json(
                { error: 'File path is required' },
                { status: 400 }
            );
        }

        const docs = await loadPdf(filePath);
        return NextResponse.json({ success: true, data: docs });
    } catch (error) {
        console.error('Error loading PDF:', error);
        return NextResponse.json(
            { error: 'Failed to load PDF' },
            { status: 500 }
        );
    }
} 