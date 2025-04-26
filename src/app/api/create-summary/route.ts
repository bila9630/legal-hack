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

const clauseSchema = z.object({
    category: z.string(),
    content: z.string(),
    importance: z.enum(['must-have', 'optional', 'red-flag'])
});

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
                            data: readFileSync(localFilePath),
                            mimeType: "application/pdf"
                        }
                    ]
                }
            ]
        });

        console.log('Generated Summary:', object);
        console.log('Clauses:', object.clauses);

        // Update the NDA record with summary
        const ndaData = {
            summary: object.summary
        };
        await pb.collection('ndas').update(recordId, ndaData);

        // Store each clause in nda_clauses collection
        for (const clause of object.clauses) {
            const clauseData = {
                nda_id: recordId,
                content: clause.content,
                category: clause.category,
                importance: clause.importance
            };
            await pb.collection('nda_clauses').create(clauseData);
        }

        return NextResponse.json({
            success: true,
            summary: object.summary,
            clauses: object.clauses
        });
    } catch (error) {
        console.error('Error creating summary:', error);
        return NextResponse.json(
            { error: 'Failed to create summary' },
            { status: 500 }
        );
    }
} 