import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import axios from 'axios';
import { join } from 'path';
import { tmpdir } from 'os';
import { pb } from '@/lib/pocketbase';

export async function POST(request: Request) {
    try {
        const { recordId, fileUrl } = await request.json();

        if (!recordId || !fileUrl) {
            return NextResponse.json(
                { error: 'Missing recordId or fileUrl' },
                { status: 400 }
            );
        }

        // Fetch the PDF from URL
        const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer'
        });

        // Create a temporary file
        const tempDir = tmpdir();
        const fileName = `temp_${Date.now()}.pdf`;
        const localFilePath = join(tempDir, fileName);

        // Write the PDF to the temporary file
        await writeFile(localFilePath, response.data);

        const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            system: "You are a helpful assistant that creates concise summaries of legal documents. Focus on key points, main arguments, and important details.",
            schema: z.object({
                summary: z.string().describe("Please be precise and concise. Do not include any additional information."),
            }),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "file",
                            data: readFileSync(localFilePath),
                            mimeType: "application/pdf"
                        }
                    ]
                }
            ]
        });

        console.log('Generated Summary:', object);

        // Update the record in PocketBase
        const data = {
            summary: object.summary
        };

        const record = await pb.collection('ndas').update(recordId, data);
        console.log('Updated record:', record);

        return NextResponse.json({ success: true, summary: object.summary });
    } catch (error) {
        console.error('Error creating summary:', error);
        return NextResponse.json(
            { error: 'Failed to create summary' },
            { status: 500 }
        );
    }
} 