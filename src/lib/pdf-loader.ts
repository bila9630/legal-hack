import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import axios from 'axios';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createEmbeddings } from './embeddings';

export async function loadPdf(filePath: string) {
    console.log("Loading PDF from", filePath);

    let localFilePath = filePath;
    const originalSource = filePath;

    // If the path is a URL, download it first
    if (filePath.startsWith('http')) {
        try {
            const response = await axios.get(filePath, {
                responseType: 'arraybuffer'
            });

            // Create a temporary file
            const tempDir = tmpdir();
            const fileName = `temp_${Date.now()}.pdf`;
            localFilePath = join(tempDir, fileName);

            // Write the PDF to the temporary file
            await writeFile(localFilePath, response.data);
            console.log("PDF downloaded to", localFilePath);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            throw new Error("Failed to download PDF from URL");
        }
    }

    // Load the PDF
    const loader = new PDFLoader(localFilePath);
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
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docsWithOriginalSource);
    console.log("Created", chunkedDocs.length, "chunks");

    // Create embeddings for the chunked documents
    const docsWithEmbeddings = await createEmbeddings(chunkedDocs);
    console.log("Created embeddings for", docsWithEmbeddings.length, "chunks");
    console.log(docsWithEmbeddings);

    return docsWithEmbeddings;
}