'use client'
import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

interface Clause {
    id: string;
    content: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
}

interface NDA {
    id: string;
    name: string;
    summary: string;
    created: string;
}

const importanceOptions = [
    { label: 'All', value: 'all' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
];

export default function NDADetailPage() {
    const params = useParams();
    const [nda, setNda] = useState<NDA | null>(null);
    const [clauses, setClauses] = useState<Clause[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterImportance, setFilterImportance] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    useEffect(() => {
        const fetchData = async () => {
            if (!params.id) return;

            try {
                setIsLoading(true);
                // Fetch NDA details
                const ndaRecord = await pb.collection('ndas').getOne(params.id as string) as NDA;
                setNda(ndaRecord);

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

    if (!params.id) {
        return <div className="p-4">No NDA selected</div>;
    }

    if (isLoading) {
        return <div className="p-4">Loading...</div>;
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
                                        onClick={() => setFilterImportance(option.value as any)}
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
                                    {filteredClauses.map((clause) => (
                                        <div key={clause.id} className="border rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline">{clause.category}</Badge>
                                                <Badge
                                                    variant={
                                                        clause.importance === 'high'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                    className={
                                                        clause.importance === 'medium'
                                                            ? 'bg-yellow-400 text-black border-yellow-400'
                                                            : ''
                                                    }
                                                >
                                                    {clause.importance}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground">{clause.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {/* Right: PDF placeholder */}
                <div className="w-full md:w-1/2 min-h-[400px] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">PDF preview coming soon…</span>
                </div>
            </div>
        </div>
    );
} 