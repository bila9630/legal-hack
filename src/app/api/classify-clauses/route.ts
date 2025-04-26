import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { OpenAIEmbeddings } from "@langchain/openai";
import { qdrantClient } from '@/lib/qdrant';

interface QdrantMetadata {
    source?: string;
    [key: string]: any;
}

const clauseSchema = z.object({
    id: z.string(),
    content: z.string(),
    category: z.string(),
});

export async function POST(request: Request) {
    try {
        const { clauses } = await request.json();

        if (!clauses || !Array.isArray(clauses)) {
            return NextResponse.json(
                { error: 'No clauses provided' },
                { status: 400 }
            );
        }

        // Create embeddings for each clause
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const classifiedClauses = await Promise.all(clauses.map(async (clause) => {
            // Create embedding for the clause
            const embedding = await embeddings.embedQuery(clause.content);

            // Search in Qdrant
            const searchResults = await qdrantClient.search("legal", {
                vector: embedding,
                limit: 1, // Get only the most similar clause
            });

            console.log("searchResults", searchResults);

            // Analyze the search results to determine classification
            const { object } = await generateObject({
                model: openai("gpt-4o-mini"),
                system: "You are a helpful assistant that analyzes legal clauses. Based on the similarity search results, determine if the clause is fulfilled, requires changes, or needs law department review. Consider the similarity scores and content of the matched clauses.",
                schema: z.object({
                    classification: z.enum(['fulfilled', 'require_change', 'law_department'])
                }),
                messages: [
                    {
                        role: "user",
                        content: `Please analyze this clause and its similar matches to determine its classification.\n\nClause to analyze:\n${clause.content}\n\nSimilar matches:\n${JSON.stringify(searchResults, null, 2)}`
                    }
                ]
            });

            return {
                ...clause,
                classification: object.classification,
                similarClause: searchResults[0] ? {
                    content: searchResults[0].payload?.content || '',
                    source: (searchResults[0].payload?.metadata as QdrantMetadata)?.source || '',
                    score: searchResults[0].score
                } : null
            };
        }));

        console.log("classifiedClauses", classifiedClauses);

        return NextResponse.json({
            success: true,
            classifiedClauses
        });
    } catch (error) {
        console.error('Error classifying clauses:', error);
        return NextResponse.json(
            { error: 'Failed to classify clauses' },
            { status: 500 }
        );
    }
} 