import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

export async function createEmbeddings(docs: Document[]) {
    try {
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const vectors = await embeddings.embedDocuments(
            docs.map(doc => doc.pageContent)
        );

        // Combine the vectors with the original documents
        const documentsWithEmbeddings = docs.map((doc, i) => ({
            ...doc,
            embedding: vectors[i],
        }));

        return documentsWithEmbeddings;
    } catch (error) {
        console.error("Error creating embeddings:", error);
        throw new Error("Failed to create embeddings");
    }
} 