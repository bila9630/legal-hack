'use client'
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TestPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-4xl font-bold">Test Page</h1>
            <Button
                onClick={handleLoadPdf}
                disabled={isLoading}
            >
                {isLoading ? 'Loading...' : 'Load PDF'}
            </Button>
            {error && (
                <p className="mt-2 text-red-500">{error}</p>
            )}
        </div>
    )
} 