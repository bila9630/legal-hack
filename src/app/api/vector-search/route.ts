import { NextResponse } from 'next/server';
import { OpenAIEmbeddings } from "@langchain/openai";
import { qdrantClient } from '@/lib/qdrant';

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        // Create embedding for the query
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const queryEmbedding = await embeddings.embedQuery(query);
        console.log('Query embedding created');

        // Search in Qdrant
        const searchResults = await qdrantClient.search("legal", {
            vector: queryEmbedding,
            limit: 5,
        });

        console.log('Search results:', searchResults);

        return NextResponse.json({
            success: true,
            results: searchResults
        });
    } catch (error) {
        console.error('Error in vector search:', error);
        return NextResponse.json(
            { error: 'Failed to perform vector search' },
            { status: 500 }
        );
    }
} 