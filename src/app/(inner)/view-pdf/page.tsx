"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DocumentViewer from '@/components/document-viewer';

interface Clause {
    id: string;
    content: string;
    category: string;
    classification?: 'fulfilled' | 'require_change' | 'law_department';
    similarClause?: {
        content: string;
        source: string;
        score: number;
    } | null;
}

interface TempNDA {
    id: string;
    name: string;
    type: string;
    summary: string;
    file: string;
}

export default function ViewPDFPage() {
    const searchParams = useSearchParams();
    const recordId = searchParams.get('recordId');

    const [nda, setNda] = useState<TempNDA | null>(null);
    const [clauses, setClauses] = useState<Clause[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!recordId) {
            setHasError('No recordId provided in URL.');
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setHasError(null);
            try {
                // Fetch NDA
                const ndaRecord = await pb.collection('temp_nda').getOne(recordId);
                setNda({
                    id: ndaRecord.id,
                    name: ndaRecord.name,
                    type: ndaRecord.type,
                    summary: ndaRecord.summary,
                    file: ndaRecord.file,
                });

                // Fetch Clauses
                const clauseRecords = await pb.collection('temp_nda_clauses').getFullList({
                    filter: `temp_nda_id="${recordId}"`,
                    sort: '+created',
                });
                const initialClauses = clauseRecords.map((c: any) => ({
                    id: c.id,
                    content: c.content,
                    category: c.category,
                }));

                // Classify clauses
                try {
                    const response = await fetch('/api/classify-clauses', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ clauses: initialClauses }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to classify clauses');
                    }

                    const data = await response.json();
                    setClauses(data.classifiedClauses);
                } catch (error) {
                    console.error('Error classifying clauses:', error);
                    setClauses(initialClauses);
                }
            } catch (error) {
                setHasError('Failed to load NDA or clauses.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [recordId]);

    // Construct file URL for DocumentViewer (PocketBase file URL pattern)
    const fileUrl = nda && nda.file && nda.id && nda.file.length > 0
        ? `${pb.baseUrl}/api/files/temp_nda/${nda.id}/${nda.file}`
        : null;

    // Fetch the file from fileUrl and convert to File object
    useEffect(() => {
        if (!nda || !fileUrl) {
            setFile(null);
            return;
        }
        let isMounted = true;
        fetch(fileUrl)
            .then(res => res.blob())
            .then(blob => {
                if (!isMounted) return;
                const fileObj = new File([blob], nda.file, { type: blob.type });
                setFile(fileObj);
            })
            .catch(() => setFile(null));
        return () => { isMounted = false; };
    }, [fileUrl, nda]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-6 h-6 mr-2" />
                Loading...
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="text-destructive text-center p-4">{hasError}</div>
        );
    }

    if (!nda) {
        return (
            <div className="text-center p-4">NDA not found.</div>
        );
    }

    return (
        <div className="w-full max-w-[95%] mx-auto px-2 sm:px-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/compare">
                    <button className="rounded-full p-2 hover:bg-accent transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                </Link>
                <h1 className="text-2xl font-bold">Viewing: {nda.name}</h1>
            </div>

            {/* Summary Card - Full Width */}
            <Card className="mb-8">
                <CardContent>
                    <div className="my-2">
                        <span className="font-medium">Summary:</span>
                        <p className="text-muted-foreground mt-1">{nda.summary || 'No summary available.'}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Main content area with two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Clauses */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Clauses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {clauses.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4">No clauses found</div>
                            ) : (
                                <div className="space-y-6">
                                    {clauses.map((clause) => (
                                        <div key={clause.id} className="border rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline">{clause.category}</Badge>
                                                {clause.classification && (
                                                    <Badge variant={
                                                        clause.classification === 'fulfilled' ? 'secondary' :
                                                            clause.classification === 'require_change' ? 'destructive' :
                                                                'default'
                                                    }>
                                                        {clause.classification}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground mb-4">{clause.content}</p>

                                            {clause.similarClause && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium">Similar Clause</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            Score: {(clause.similarClause.score * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {clause.similarClause.content}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Source: {clause.similarClause.source}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Document Viewer */}
                <div className="flex flex-col">
                    {file ? (
                        <div className="w-full h-full min-h-[600px]">
                            <DocumentViewer file={file} className="w-full h-full min-h-[600px]" />
                        </div>
                    ) : (
                        <div className="text-muted-foreground">No file available for this NDA.</div>
                    )}
                </div>
            </div>
        </div>
    );
} 