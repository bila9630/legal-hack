'use client'

import { useState } from "react";
import FileDropzone from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, X } from "lucide-react";
import { pb } from '@/lib/pocketbase';

export default function ComparePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const removeFile = (fileToRemove: File) => {
        setFiles(files.filter((file) => file !== fileToRemove));
    };

    const handleCompare = async () => {
        if (!files.length) return;
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', files[0]);
            // You can add more fields if needed, e.g. name/type
            await pb.collection('ndas').create(formData);
            // Optionally, show success or reset state here
        } catch (error) {
            // Optionally, handle error here
            console.error('Upload failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <Label htmlFor="file" className="mb-2 block text-sm text-white">File</Label>
            <FileDropzone
                files={files}
                setFiles={setFiles}
                acceptedFileTypes={{ "application/pdf": [".pdf"] }}
                className="rounded-lg border-2 border-dashed border-gray-300 h-48 p-10 bg-black/80 hover:bg-black/60 transition-colors duration-150 flex items-center justify-center"
            >
                <div className="text-center">
                    {files.length > 0 ? (
                        <div className="max-h-40 cursor-pointer space-y-2 overflow-y-auto">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between rounded bg-gray-900/80 p-2">
                                    <div className="mr-2 flex min-w-0 flex-1 items-center">
                                        <FileText className="mr-2 h-5 w-5 text-blue-400" />
                                        <p className="truncate text-sm text-gray-200">{file.name}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0"
                                        onClick={e => {
                                            e.stopPropagation();
                                            removeFile(file);
                                        }}
                                    >
                                        <X className="h-4 w-4 text-red-400" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">
                            Drag and drop files here, or click to select files
                        </p>
                    )}
                </div>
            </FileDropzone>
            <Button
                className="mt-6 w-full"
                size="lg"
                onClick={handleCompare}
                disabled={isLoading || files.length === 0}
            >
                {isLoading ? 'Uploading...' : 'Compare'}
            </Button>
        </div>
    );
}