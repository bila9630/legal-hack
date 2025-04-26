import { QdrantClient } from "@qdrant/js-client-rest";
import { Document } from "@langchain/core/documents";

interface DocumentWithEmbedding extends Document {
    embedding: number[];
}

const QDRANT_URL = process.env.QDRANT_HOST;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

export const qdrantClient = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    checkCompatibility: false, // Skip version check
});

export async function storeEmbeddings(documents: DocumentWithEmbedding[]) {
    try {
        const points = documents.map((doc, index) => ({
            id: index,
            vector: doc.embedding,
            payload: {
                content: doc.pageContent,
                metadata: doc.metadata,
            },
        }));

        await qdrantClient.upsert("legal", {
            points,
        });

        console.log(`Successfully stored ${points.length} documents in Qdrant`);
    } catch (error) {
        console.error("Error storing embeddings in Qdrant:", error);
        throw new Error("Failed to store embeddings in Qdrant");
    }
} 