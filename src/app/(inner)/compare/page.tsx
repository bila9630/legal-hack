'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FileDropzone from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, X, Check, ChevronsUpDown, FileIcon, Type } from "lucide-react";
import { pb } from '@/lib/pocketbase';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface Document {
    id: string;
    label: string;
    collectionId?: string;
    file?: string;
}

export default function ComparePage() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [freeText, setFreeText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [open, setOpen] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [inputType, setInputType] = useState<'file' | 'text'>('file');
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([
        { id: "all", label: "Compare to All" }
    ]);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const records = await pb.collection('ndas').getFullList({
                    sort: '-created',
                });
                const docs = records.map(record => ({
                    id: record.id,
                    label: record.name || record.file,
                    collectionId: record.collectionId,
                    file: record.file
                }));
                setDocuments([{ id: "all", label: "Compare to All" }, ...docs]);
            } catch (error) {
                console.error('Error fetching documents:', error);
                setError('Failed to fetch documents');
            }
        };

        fetchDocuments();
    }, []);

    const removeFile = (fileToRemove: File) => {
        setFiles(files.filter((file) => file !== fileToRemove));
    };

    const toggleDocument = (docId: string) => {
        if (docId === "all") {
            if (selectedDocs.includes("all")) {
                setSelectedDocs([]);
            } else {
                setSelectedDocs(documents.map(doc => doc.id));
            }
            return;
        }

        setSelectedDocs(prev => {
            const newSelection = prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId];

            const allDocsExceptAll = documents.filter(doc => doc.id !== "all").map(doc => doc.id);
            const allIndividualDocsSelected = allDocsExceptAll.every(id => newSelection.includes(id));

            if (allIndividualDocsSelected && !newSelection.includes("all")) {
                return [...newSelection, "all"];
            } else if (!allIndividualDocsSelected && newSelection.includes("all")) {
                return newSelection.filter(id => id !== "all");
            }

            return newSelection;
        });
    };

    const handleCompare = async () => {
        if ((!files.length && !freeText) || !selectedDocs.length) return;
        setIsLoading(true);
        setError(null);

        try {
            let fileToProcess: File;

            if (inputType === 'file' && files[0]) {
                fileToProcess = files[0];
            } else if (inputType === 'text' && freeText) {
                const blob = new Blob([freeText], { type: 'text/plain' });
                fileToProcess = new File([blob], 'input.txt', { type: 'text/plain' });
            } else {
                throw new Error('No valid input provided');
            }

            // Step 1: Uploading file
            setProcessingStep('Uploading file...');

            const formData = new FormData();
            formData.append('file', fileToProcess);
            formData.append('type', 'nda');
            formData.append('name', fileToProcess.name.replace(/\.[^/.]+$/, ""));

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Upload failed');
            }

            // Step 2: Converting file (if needed)
            setProcessingStep('Converting file...');

            // Handle converted file if present
            if (responseData.convertedFile) {
                const { data, type, name } = responseData.convertedFile;
                const binaryData = atob(data);
                const bytes = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                    bytes[i] = binaryData.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type });
                const convertedFile = new File([blob], name, { type });

                const fileData = {
                    name: convertedFile.name,
                    type: convertedFile.type,
                    data: Array.from(bytes)
                };

                // Step 3: Processing clauses
                setProcessingStep('Processing clauses...');

                // Send file data to get-clauses endpoint
                const clausesResponse = await fetch('/api/get-clauses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileData }),
                });

                if (!clausesResponse.ok) {
                    const errorData = await clausesResponse.json();
                    throw new Error(errorData.error || 'Failed to process clauses');
                }

                const clausesData = await clausesResponse.json();
                if (!clausesData.recordId) throw new Error('No recordId returned');

                router.push(`/view-pdf?recordId=${clausesData.recordId}`);
                return;
            } else {
                const arrayBuffer = await fileToProcess.arrayBuffer();
                const fileData = {
                    name: fileToProcess.name,
                    type: fileToProcess.type,
                    data: Array.from(new Uint8Array(arrayBuffer))
                };

                // Step 3: Processing clauses
                setProcessingStep('Processing clauses...');

                // Send file data to get-clauses endpoint
                const clausesResponse = await fetch('/api/get-clauses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileData }),
                });

                if (!clausesResponse.ok) {
                    const errorData = await clausesResponse.json();
                    throw new Error(errorData.error || 'Failed to process clauses');
                }

                const clausesData = await clausesResponse.json();
                if (!clausesData.recordId) throw new Error('No recordId returned');

                router.push(`/view-pdf?recordId=${clausesData.recordId}`);
                return;
            }
        } catch (error) {
            console.error('Processing failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to process file');
        } finally {
            setIsLoading(false);
            setProcessingStep('');
        }
    };

    const getButtonText = () => {
        // Exclude the 'all' pseudo-id from the count
        const realSelectedDocs = selectedDocs.filter(id => id !== "all");

        if (realSelectedDocs.length === 0) {
            // If only 'all' is selected, treat as 'Compare to All'
            if (selectedDocs.includes("all")) {
                return "Compare to All";
            }
            return "Select documents to compare";
        } else if (realSelectedDocs.length === 1) {
            const selectedDoc = documents.find(doc => doc.id === realSelectedDocs[0]);
            return `Compare to ${selectedDoc?.label || ''}`;
        } else {
            return `${realSelectedDocs.length} documents selected`;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                        {error}
                    </div>
                )}
                <Tabs defaultValue="file" className="w-full" onValueChange={(value) => {
                    setInputType(value as 'file' | 'text');
                    setError(null);
                }}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="file" className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4" />
                            Upload File
                        </TabsTrigger>
                        <TabsTrigger value="text" className="flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            Enter Text
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="mt-0">
                        <Label htmlFor="file" className="mb-2 block text-sm">File</Label>
                        {files.length > 0 ? (
                            <div className="rounded-lg border bg-card p-4">
                                <div className="flex items-center justify-between rounded bg-muted p-2">
                                    <div className="mr-2 flex min-w-0 flex-1 items-center">
                                        <FileText className="mr-2 h-5 w-5 text-primary" />
                                        <p className="truncate text-sm">{files[0].name}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0"
                                        onClick={() => removeFile(files[0])}
                                    >
                                        <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <FileDropzone
                                files={files}
                                setFiles={setFiles}
                                className="rounded-lg border-2 border-dashed border-muted h-48 p-10 bg-card hover:bg-accent/50 transition-colors duration-150 flex items-center justify-center"
                            >
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Drop your document here or click to browse
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Supported formats: PDF, DOC, DOCX
                                    </p>
                                </div>
                            </FileDropzone>
                        )}
                    </TabsContent>

                    <TabsContent value="text" className="mt-0">
                        <Label htmlFor="text" className="mb-2 block text-sm">Text Input</Label>
                        <Textarea
                            placeholder="Enter your text here..."
                            value={freeText}
                            onChange={(e) => setFreeText(e.target.value)}
                            className="min-h-[200px] resize-none"
                        />
                    </TabsContent>
                </Tabs>

                <div className="space-y-4">
                    <Label className="text-sm">Compare with</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                            >
                                {getButtonText()}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandEmpty>No documents found.</CommandEmpty>
                                <CommandGroup>
                                    {documents.map((doc) => (
                                        <CommandItem
                                            key={doc.id}
                                            onSelect={() => toggleDocument(doc.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedDocs.includes(doc.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {doc.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <Button
                        className="w-full"
                        onClick={handleCompare}
                        disabled={isLoading || (!files.length && !freeText) || !selectedDocs.length}
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                {processingStep}
                            </>
                        ) : (
                            "Compare Documents"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}