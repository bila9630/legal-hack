'use client';

import { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import PdfViewer from './pdf-viewer';
import { cn } from '@/lib/utils';

interface DocumentViewerProps {
    file: File;
    className?: string;
}

export default function DocumentViewer({ file, className }: DocumentViewerProps) {
    const [content, setContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDocument = async () => {
            setIsLoading(true);
            setError(null);
            
            const fileExtension = file.name.toLowerCase().split('.').pop();
            const mimeType = file.type.toLowerCase();
            
            console.log('Loading document:', {
                fileName: file.name,
                fileType: file.type,
                fileExtension,
                mimeType
            });

            try {
                // Handle PDF files
                if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
                    setContent('');  // PDF will be handled by PdfViewer
                } 
                // Handle DOCX files
                else if (
                    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    fileExtension === 'docx'
                ) {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setContent(result.value);
                }
                // Handle DOC files
                else if (
                    mimeType === 'application/msword' ||
                    mimeType === 'application/vnd.ms-word' ||
                    mimeType === 'application/x-msword' ||
                    fileExtension === 'doc'
                ) {
                    // For DOC files, we expect them to be converted to PDF by the server
                    // The file we receive should already be in PDF format
                    if (file instanceof Blob && file.type === 'application/pdf') {
                        setContent(''); // Will be handled by PdfViewer
                    } else {
                        throw new Error('DOC file must be converted to PDF first');
                    }
                }
                // Handle text files
                else if (mimeType === 'text/plain' || fileExtension === 'txt') {
                    const text = await file.text();
                    setContent(`<pre style="white-space: pre-wrap;">${text}</pre>`);
                } 
                else {
                    throw new Error(`Unsupported file type: ${mimeType} (${fileExtension})`);
                }
            } catch (err) {
                console.error('Error loading document:', err);
                setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                setIsLoading(false);
            }
        };

        if (file) {
            loadDocument();
        }
    }, [file]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive">
                    {error}
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-muted-foreground">Loading document...</div>
            </div>
        );
    }

    // For PDF files (including converted DOC files), use the PDF viewer
    if (file.type === 'application/pdf') {
        return <PdfViewer file={file} className={className} />;
    }

    // For DOCX and other document types, render the HTML content
    return (
        <div className={cn("document-viewer", className)}>
            <style jsx global>{`
                .document-viewer {
                    padding: 2rem;
                    background: white;
                    color: black;
                    overflow-y: auto;
                }
                .document-viewer h1 {
                    font-size: 2em;
                    margin: 0.67em 0;
                    font-weight: bold;
                }
                .document-viewer h2 {
                    font-size: 1.5em;
                    margin: 0.83em 0;
                    font-weight: bold;
                }
                .document-viewer h3 {
                    font-size: 1.17em;
                    margin: 1em 0;
                    font-weight: bold;
                }
                .document-viewer p {
                    margin: 1em 0;
                    line-height: 1.5;
                }
                .document-viewer ul, .document-viewer ol {
                    margin: 1em 0;
                    padding-left: 40px;
                }
                .document-viewer ul {
                    list-style-type: disc;
                }
                .document-viewer ol {
                    list-style-type: decimal;
                }
                .document-viewer table {
                    border-collapse: collapse;
                    margin: 1em 0;
                    width: 100%;
                }
                .document-viewer th, .document-viewer td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .document-viewer th {
                    background-color: #f5f5f5;
                }
                .document-viewer img {
                    max-width: 100%;
                    height: auto;
                }
                .document-viewer strong, .document-viewer b {
                    font-weight: bold;
                }
                .document-viewer em, .document-viewer i {
                    font-style: italic;
                }
                .document-viewer pre {
                    font-family: monospace;
                    background-color: #f5f5f5;
                    padding: 1em;
                    border-radius: 4px;
                    overflow-x: auto;
                }
            `}</style>
            <div 
                className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none"
                dangerouslySetInnerHTML={{ __html: content }} 
            />
        </div>
    );
} 