'use client'

import { useState } from "react";
import FileDropzone from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, X, Check, ChevronsUpDown } from "lucide-react";
import { pb } from '@/lib/pocketbase';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"

// Placeholder documents (replace with actual uploaded documents later)
const DOCUMENTS = [
    { id: "all", label: "Compare to All" },
    { id: "nda1_1", label: "nda1_1.PDF" },
    { id: "nda1_2", label: "nda1_2.PDF" },
    { id: "nda1_3", label: "nda1_3.PDF" },
    { id: "nda1_4", label: "nda1_4.PDF" },
];

export default function ComparePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

    const removeFile = (fileToRemove: File) => {
        setFiles(files.filter((file) => file !== fileToRemove));
    };

    const toggleDocument = (docId: string) => {
        if (docId === "all") {
            // If "Compare to All" is selected, select all documents except "all"
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

            // Check if all individual documents are selected
            const allDocsExceptAll = DOCUMENTS.filter(doc => doc.id !== "all").map(doc => doc.id);
            const allIndividualDocsSelected = allDocsExceptAll.every(id => newSelection.includes(id));

            // Add or remove "all" based on whether all individual docs are selected
            if (allIndividualDocsSelected && !newSelection.includes("all")) {
                return [...newSelection, "all"];
            } else if (!allIndividualDocsSelected && newSelection.includes("all")) {
                return newSelection.filter(id => id !== "all");
            }

            return newSelection;
        });
    };

    const handleCompare = async () => {
        if (!files.length || !selectedDocs.length) return;
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', files[0]);
            formData.append('compareWith', JSON.stringify(selectedDocs));
            await pb.collection('ndas').create(formData);
            // Optionally, show success message here
        } catch (error) {
            console.error('Upload failed:', error);
            // Optionally, show error message here
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
        <div className="max-w-md mx-auto mt-10">
            <Label htmlFor="file" className="mb-2 block text-sm text-white">File</Label>
            {files.length > 0 ? (
                <div className="rounded-lg border border-gray-300 bg-black/80 p-4">
                    <div className="flex items-center justify-between rounded bg-gray-900/80 p-2">
                        <div className="mr-2 flex min-w-0 flex-1 items-center">
                            <FileText className="mr-2 h-5 w-5 text-blue-400" />
                            <p className="truncate text-sm text-gray-200">{files[0].name}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={() => removeFile(files[0])}
                        >
                            <X className="h-4 w-4 text-red-400" />
                        </Button>
                    </div>
                </div>
            ) : (
                <FileDropzone
                    files={files}
                    setFiles={setFiles}
                    acceptedFileTypes={{ "application/pdf": [".pdf"] }}
                    className="rounded-lg border-2 border-dashed border-gray-300 h-48 p-10 bg-black/80 hover:bg-black/60 transition-colors duration-150 flex items-center justify-center"
                >
                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            Drag and drop files here, or click to select files
                        </p>
                    </div>
                </FileDropzone>
            )}

            <div className="flex gap-2 mt-6">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                            disabled={files.length === 0}
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
                                        value={doc.id}
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
                    className="shrink-0"
                    disabled={isLoading || files.length === 0 || selectedDocs.length === 0}
                    onClick={handleCompare}
                >
                    {isLoading ? 'Processing...' : 'Compare'}
                </Button>
            </div>
        </div>
    );
}