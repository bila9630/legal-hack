'use client';

import { useEffect, useState, useRef } from 'react';
import PdfViewer from './pdf-viewer';
import dynamic from 'next/dynamic';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

interface DocumentViewerProps {
    file: File | null;
    text?: string;
    className?: string;
}

// Create a client-side only component for DOCX rendering
const DocxRenderer = dynamic(() => Promise.resolve(({ file }: { file: File }) => {
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderDocument = async () => {
            if (!file) return;

            try {
                const arrayBuffer = await file.arrayBuffer();
                const zip = new PizZip(arrayBuffer);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                });

                // Load the document content
                doc.render();
                
                // Get the document as a string
                const content = doc.getZip().files['word/document.xml'].asText();
                
                // Basic XML to HTML conversion
                const htmlString = content
                    .replace(/<w:p[^>]*>/g, '<p>') // Convert paragraphs
                    .replace(/<\/w:p>/g, '</p>')
                    .replace(/<w:r[^>]*>/g, '<span>') // Convert runs
                    .replace(/<\/w:r>/g, '</span>')
                    .replace(/<w:t[^>]*>/g, '') // Remove text wrapper tags
                    .replace(/<\/w:t>/g, '')
                    .replace(/<[^>]+>/g, '') // Remove any remaining XML tags
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => `<p>${line}</p>`)
                    .join('\n');

                setHtmlContent(htmlString);
                
            } catch (error) {
                console.error('Error processing DOCX:', error);
                setError('Error processing document. Please try a different file format.');
            }
        };

        renderDocument();
    }, [file]);

    if (error) {
        return (
            <div className="text-red-500 p-4 bg-red-50 rounded-lg">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-2">Try converting the document to PDF format first.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-sm p-6 overflow-auto">
            <div 
                className="docx-content prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}), { ssr: false });

export default function DocumentViewer({ file, text, className }: DocumentViewerProps) {
    const [content, setContent] = useState<string>('');
    const [fileType, setFileType] = useState<'pdf' | 'docx' | 'text' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [docxFile, setDocxFile] = useState<ArrayBuffer | null>(null);
    const docxContainerRef = useRef<HTMLDivElement>(null);

    // Handle file type detection and initial processing
    useEffect(() => {
        if (text) {
            setContent(text);
            setFileType('text');
            setDocxFile(null);
            return;
        }

        if (!file) {
            setDocxFile(null);
            return;
        }

        const processFile = async () => {
            setIsLoading(true);
            setError(null);

            try {
                console.log('Processing file:', {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });

                if (file.type === 'application/pdf') {
                    setFileType('pdf');
                    setDocxFile(null);
                } else if (
                    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    file.type === 'application/msword'
                ) {
                    console.log('DOCX file detected');
                    setFileType('docx');
                    setDocxFile(null);
                } else if (file.type === 'text/plain') {
                    const text = await file.text();
                    setContent(text);
                    setFileType('text');
                    setDocxFile(null);
                } else {
                    throw new Error(`Unsupported file type: ${file.type}`);
                }
            } catch (err) {
                console.error('Document processing error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error processing document');
            } finally {
                setIsLoading(false);
            }
        };

        processFile();
    }, [file, text]);

    // Handle DOCX rendering
    useEffect(() => {
        if (!docxFile || !docxContainerRef.current || fileType !== 'docx') {
            return;
        }

        const renderDocument = async () => {
            const container = docxContainerRef.current;
            if (!container) return;

            try {
                container.innerHTML = '';
                console.log('Starting DOCX render with docxtemplater');
                
                const zip = new PizZip(docxFile);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                });

                // Load the document content
                doc.render();
                
                // Get the document as a string
                const content = doc.getZip().files['word/document.xml'].asText();
                
                // Basic XML to HTML conversion
                const htmlString = content
                    .replace(/<w:p[^>]*>/g, '<p>') // Convert paragraphs
                    .replace(/<\/w:p>/g, '</p>')
                    .replace(/<w:r[^>]*>/g, '<span>') // Convert runs
                    .replace(/<\/w:r>/g, '</span>')
                    .replace(/<w:t[^>]*>/g, '') // Remove text wrapper tags
                    .replace(/<\/w:t>/g, '')
                    .replace(/<[^>]+>/g, '') // Remove any remaining XML tags
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => `<p>${line}</p>`)
                    .join('\n');

                container.innerHTML = `
                    <div class="docx-content prose prose-sm max-w-none">
                        ${htmlString}
                    </div>
                `;
                
                console.log('DOCX render completed');
            } catch (err) {
                console.error('DOCX rendering error:', err);
                setError('Error processing document. Please try a different file format.');
            }
        };

        renderDocument();

        return () => {
            if (docxContainerRef.current) {
                docxContainerRef.current.innerHTML = '';
            }
        };
    }, [docxFile, fileType]);

    if (!file && !text) {
        return <div className="text-center p-4">No content to display</div>;
    }

    if (error) {
        return (
            <div className="text-center p-4 text-red-500">
                {error}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="text-center p-4">
                Loading document...
            </div>
        );
    }

    if (fileType === 'pdf' && file) {
        return <PdfViewer file={file} className={className} />;
    }

    if (fileType === 'docx' && file) {
        return <DocxRenderer file={file} />;
    }

    return (
        <div className={`bg-white text-black rounded-lg overflow-auto ${className}`}>
            <div className="p-8 whitespace-pre-wrap font-mono text-sm">
                {content}
            </div>
        </div>
    );
} 