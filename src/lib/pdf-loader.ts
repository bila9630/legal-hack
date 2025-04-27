import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import axios from 'axios';
import { createEmbeddings } from './embeddings';
import { storeEmbeddings } from './qdrant';

export async function loadPdf(filePath: string) {
    console.log("Loading PDF from", filePath);

    let buffer: Buffer;
    const originalSource = filePath;

    // If the path is a URL, download it
    if (filePath.startsWith('http')) {
        try {
            const response = await axios.get(filePath, {
                responseType: 'arraybuffer'
            });
            buffer = Buffer.from(response.data);
            console.log("PDF downloaded, size:", buffer.length);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            throw new Error("Failed to download PDF from URL");
        }
    } else {
        // For local files, read directly into buffer
        try {
            const response = await axios.get(filePath, {
                responseType: 'arraybuffer'
            });
            buffer = Buffer.from(response.data);
            console.log("PDF loaded, size:", buffer.length);
        } catch (error) {
            console.error("Error loading PDF:", error);
            throw new Error("Failed to load PDF");
        }
    }

    // Convert buffer to Blob for PDFLoader
    const blob = new Blob([buffer], { type: 'application/pdf' });

    // Load the PDF from blob
    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    console.log("Loaded", docs.length, "documents");

    // Update metadata to use original source
    // metaddata { source: 'https://hackathon24.pockethost.io' }
    const docsWithOriginalSource = docs.map(doc => ({
        ...doc,
        metadata: {
            ...doc.metadata,
            source: originalSource
        }
    }));

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 600,
        chunkOverlap: 100,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docsWithOriginalSource);
    console.log("Split into", chunkedDocs.length, "chunks");

    // Create embeddings for the chunks
    const docsWithEmbeddings = await createEmbeddings(chunkedDocs);
    console.log("Created embeddings for", docsWithEmbeddings.length, "chunks");

    // Store embeddings in Qdrant
    await storeEmbeddings(docsWithEmbeddings);
    console.log("Stored embeddings in Qdrant");

    return docsWithEmbeddings;
}