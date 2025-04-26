'use client'
import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import DocumentViewer from '@/components/document-viewer';

interface Clause {
    id: string;
    content: string;
    category: string;
    importance: 'must-have' | 'optional' | 'red-flag';
}

interface NDA {
    id: string;
    name: string;
    summary: string;
    created: string;
    file: string;
    collectionId: string;
}

const importanceOptions = [
    { label: 'All', value: 'all' },
    { label: 'Must-have', value: 'must-have' },
    { label: 'Optional', value: 'optional' },
    { label: 'Red-flag', value: 'red-flag' },
];

type Importance = 'all' | 'must-have' | 'optional' | 'red-flag';

export default function NDADetailPage() {
    const params = useParams();
    const [nda, setNda] = useState<NDA | null>(null);
    const [clauses, setClauses] = useState<Clause[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterImportance, setFilterImportance] = useState<Importance>('all');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!params.id) return;

            try {
                setIsLoading(true);
                // Fetch NDA details
                const ndaRecord = await pb.collection('ndas').getOne(params.id as string) as NDA;
                setNda(ndaRecord);

                // Get the file if available
                if (ndaRecord.file) {
                    const url = pb.files.getUrl(ndaRecord, ndaRecord.file);
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const file = new File([blob], ndaRecord.file, { type: 'application/pdf' });
                    setFile(file);
                }

                // Fetch clauses
                const resultList = await pb.collection('nda_clauses').getList(1, 50, {
                    filter: `nda_id = "${params.id}"`,
                    sort: '-created',
                });
                setClauses(resultList.items.map(item => ({
                    id: item.id,
                    content: item.content,
                    category: item.category,
                    importance: item.importance
                })));
            } catch (err) {
                setError('Failed to fetch data');
                console.error('Error fetching data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [params.id]);

    const filteredClauses = filterImportance === 'all'
        ? clauses
        : clauses.filter((clause) => clause.importance === filterImportance);

    const getBadgeProps = (importance: Clause['importance']): { variant: 'secondary' | 'destructive'; className: string } => {
        switch (importance) {
            case 'red-flag':
                return { variant: 'destructive', className: '' };
            case 'must-have':
                return { variant: 'secondary', className: 'bg-green-500 text-white border-green-500' };
            case 'optional':
                return { variant: 'secondary', className: 'bg-yellow-400 text-black border-yellow-400' };
            default:
                return { variant: 'secondary', className: '' };
        }
    };

    if (!params.id) {
        return <div className="p-4">No NDA selected</div>;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    if (!nda) {
        return <div className="p-4">NDA not found</div>;
    }

    return (
        <div className="w-full max-w-[95%] mx-auto px-2 sm:px-4 py-4">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>{nda.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{nda.summary || 'No summary available'}</p>
                </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Clauses */}
                <div className="w-full md:w-1/2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Clauses</CardTitle>
                            <div className="flex gap-2 mt-2">
                                {importanceOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={filterImportance === option.value ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFilterImportance(option.value as Importance)}
                                        type="button"
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredClauses.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4">No clauses found</div>
                            ) : (
                                <div className="space-y-6">
                                    {filteredClauses.map((clause) => {
                                        const badgeProps = getBadgeProps(clause.importance);
                                        return (
                                            <div key={clause.id} className="border rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline">{clause.category}</Badge>
                                                    <Badge variant={badgeProps.variant} className={badgeProps.className}>
                                                        {clause.importance}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground">{clause.content}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {/* Right: PDF Viewer */}
                <div className="w-full md:w-1/2">
                    <Card className="h-full min-h-[600px]">
                        <CardContent className="p-0 h-full">
                            {file ? (
                                <DocumentViewer file={file} className="w-full min-h-[600px]" />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <span className="text-muted-foreground">No file available</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 