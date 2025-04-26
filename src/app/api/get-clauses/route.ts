import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { pb } from '@/lib/pocketbase';

const clauseSchema = z.object({
    category: z.string(),
    content: z.string(),
    // importance: z.enum(['must-have', 'optional', 'red-flag'])
});

export async function POST(request: Request) {
    try {
        const { fileData } = await request.json();

        if (!fileData) {
            return NextResponse.json(
                { error: 'No file data provided' },
                { status: 400 }
            );
        }

        // Destructure fileData
        const { name, type, data } = fileData;

        // Create a temporary file
        const tempDir = tmpdir();
        const fileName = `temp_${Date.now()}.${type.split('/')[1]}`;
        const localFilePath = join(tempDir, fileName);

        // Convert data array back to Buffer and write to file
        const buffer = Buffer.from(data);
        await writeFile(localFilePath, buffer);

        const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            system: "You are a helpful assistant that analyzes legal documents. Extract key clauses and categorize them. Focus on identifying termination conditions, liability provisions, confidentiality requirements, payment terms, intellectual property rights, and governance structures. For each clause, determine its importance level based on its impact and scope.",
            schema: z.object({
                summary: z.string().describe("Provide a concise overview of the document's main purpose and key provisions."),
                clauses: z.array(clauseSchema).describe("Extract and categorize key clauses from the document. For each clause, specify its category, content, and importance level.")
            }),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "file",
                            data: buffer,
                            mimeType: type
                        }
                    ]
                }
            ]
        });


        // Store result in PocketBase
        const formData = new FormData();
        formData.append('name', name);
        formData.append('type', type);
        formData.append('summary', object.summary);
        // Convert buffer to Blob for file upload
        const fileBlob = new Blob([buffer], { type });
        formData.append('file', fileBlob, name);

        const record = await pb.collection('temp_nda').create(formData);

        console.log('Record created:', record);

        // Insert clauses into temp_nda_clauses
        if (Array.isArray(object.clauses)) {
            await Promise.all(
                object.clauses.map(async (clause: any) => {
                    const clauseData = {
                        temp_nda_id: record.id,
                        content: clause.content,
                        category: clause.category
                    };
                    await pb.collection('temp_nda_clauses').create(clauseData);
                })
            );
        }

        return NextResponse.json({
            success: true,
            recordId: record.id
        });
    } catch (error) {
        console.error('Error processing file data:', error);
        return NextResponse.json(
            { error: 'Failed to process file data' },
            { status: 500 }
        );
    }
} 