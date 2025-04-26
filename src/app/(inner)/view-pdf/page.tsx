'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PdfViewer from '@/components/pdf-viewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ViewPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        // Get the file from sessionStorage when the component mounts
        const storedFile = sessionStorage.getItem('pdfFile');
        if (storedFile) {
            const fileData = JSON.parse(storedFile);
            const reconstructedFile = new File(
                [Buffer.from(fileData.data)],
                fileData.name,
                { type: fileData.type }
            );
            setFile(reconstructedFile);
            // Clear the stored file after retrieving it
            sessionStorage.removeItem('pdfFile');
        }
    }, []);

    if (!file) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-lg">No PDF file found.</p>
                <Link href="/compare">
                    <Button>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Compare
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/compare">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/20">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Viewing: {file.name}</h1>
                </div>
            </div>

            {/* Main content area with three columns */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left sidebar - placeholder for future content */}
                <div className="col-span-2 bg-black/40 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Left sidebar content</div>
                </div>

                {/* Center column with PDF viewer */}
                <div className="col-span-8 bg-black/20 rounded-lg p-4">
                    <div className="bg-black/40 rounded-lg overflow-hidden">
                        <PdfViewer file={file} className="w-full" />
                    </div>
                </div>

                {/* Right sidebar - placeholder for future content */}
                <div className="col-span-2 bg-black/40 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Right sidebar content</div>
                </div>
            </div>
        </div>
    );
} 