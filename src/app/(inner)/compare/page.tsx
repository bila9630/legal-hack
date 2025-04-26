'use client'

import { useState } from "react";
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

// Placeholder documents (replace with actual uploaded documents later)
const DOCUMENTS = [
    { id: "all", label: "Compare to All" },
    { id: "nda1_1", label: "nda1_1.PDF" },
    { id: "nda1_2", label: "nda1_2.PDF" },
    { id: "nda1_3", label: "nda1_3.PDF" },
    { id: "nda1_4", label: "nda1_4.PDF" },
];

export default function ComparePage() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [freeText, setFreeText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [inputType, setInputType] = useState<'file' | 'text'>('file');
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const removeFile = (fileToRemove: File) => {
        setFiles(files.filter((file) => file !== fileToRemove));
    };

    const toggleDocument = (docId: string) => {
        if (docId === "all") {
            if (selectedDocs.includes("all")) {
                setSelectedDocs([]);
            } else {
                setSelectedDocs(DOCUMENTS.map(doc => doc.id));
            }
            return;
        }

        setSelectedDocs(prev => {
            const newSelection = prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId];

            const allDocsExceptAll = DOCUMENTS.filter(doc => doc.id !== "all").map(doc => doc.id);
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

            // First store the file in sessionStorage
            const arrayBuffer = await fileToProcess.arrayBuffer();
            const fileData = {
                name: fileToProcess.name,
                type: fileToProcess.type,
                data: Array.from(new Uint8Array(arrayBuffer))
            };
            sessionStorage.setItem('documentFile', JSON.stringify(fileData));

            // Then upload the file
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

            // If everything is successful, navigate to the view page
            router.push('/view-pdf');
        } catch (error) {
            console.error('Processing failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to process file');
            // Remove the stored file if upload failed
            sessionStorage.removeItem('documentFile');
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (selectedDocs.length === 0) {
            return "Select documents to compare";
        } else if (selectedDocs.length === 1) {
            const selectedDoc = DOCUMENTS.find(doc => doc.id === selectedDocs[0]);
            return `Compare to ${selectedDoc?.label || ''}`;
        } else {
            return `${selectedDocs.length} documents selected`;
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
                                        Drop your PDF file here or click to browse
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Supported format: PDF
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
                                    {DOCUMENTS.map((doc) => (
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
                                Processing...
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