'use client'
import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function NDADetailPage() {
    const params = useParams();
    const [nda, setNda] = useState<NDA | null>(null);
    const [clauses, setClauses] = useState<Clause[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        <div className="container mx-auto py-8">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>{nda.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{nda.summary || 'No summary available'}</p>
                </CardContent>
            </Card>

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
                                        <Badge
                                            variant={clause.importance === 'high' ? 'destructive' :
                                                clause.importance === 'medium' ? 'default' : 'secondary'}
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
    );
} 