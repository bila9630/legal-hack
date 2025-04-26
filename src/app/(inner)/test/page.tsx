'use client'
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

interface SearchResult {
    id: number;
    score: number;
    payload: {
        content: string;
        metadata: {
            source: string;
        };
    };
}

export default function TestPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    const handleLoadPdf = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filePath: "https://hackathon24.pockethost.io/api/files/xzxlj6t322f5ijg/arabfst450jhmo9/blub_VL8KbrQ83f.pdf"
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to load PDF');
            }

            const data = await response.json();
            console.log('PDF loaded successfully:', data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error loading PDF:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/vector-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: searchQuery
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to search');
            }

            const data = await response.json();
            setSearchResults(data.results);
            console.log('Search results:', data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error searching:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-4xl font-bold mb-8">Test Page</h1>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <Button
                        onClick={handleLoadPdf}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Load PDF'}
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Input
                        type="text"
                        placeholder="Enter your search query..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                    />
                    <Button
                        onClick={handleSearch}
                        disabled={isLoading || !searchQuery}
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </div>

                {error && (
                    <p className="text-red-500">{error}</p>
                )}

                {searchResults.length > 0 && (
                    <div className="space-y-4 mt-8">
                        <h2 className="text-2xl font-semibold">Search Results</h2>
                        {searchResults.map((result) => (
                            <Card key={result.id}>
                                <CardHeader>
                                    <CardTitle className="text-sm text-muted-foreground">
                                        Score: {(result.score * 100).toFixed(2)}%
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap">{result.payload.content}</p>
                                </CardContent>
                                <CardFooter>
                                    <a
                                        href={result.payload.metadata.source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        View PDF
                                    </a>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
} 