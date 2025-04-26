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
        try {
            const file = files[0];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const formData = new FormData();
<<<<<<< HEAD
            
            if (inputType === 'file' && files[0]) {
                // Store the file in sessionStorage
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    const arrayBuffer = fileReader.result as ArrayBuffer;
                    const fileData = {
                        name: files[0].name,
                        type: files[0].type,
                        data: Array.from(new Uint8Array(arrayBuffer))
                    };
                    sessionStorage.setItem('documentFile', JSON.stringify(fileData));
                    router.push('/view-pdf');
                };
                fileReader.readAsArrayBuffer(files[0]);
            } else if (inputType === 'text' && freeText) {
                // Create a text file from the free text
                const blob = new Blob([freeText], { type: 'text/plain' });
                const file = new File([blob], 'input.txt', { type: 'text/plain' });
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    const arrayBuffer = fileReader.result as ArrayBuffer;
                    const fileData = {
                        name: 'input.txt',
                        type: 'text/plain',
                        data: Array.from(new Uint8Array(arrayBuffer))
                    };
                    sessionStorage.setItem('documentFile', JSON.stringify(fileData));
                    router.push('/view-pdf');
                };
                fileReader.readAsArrayBuffer(file);
            }
=======
            formData.append('file', file);
            formData.append('type', 'nda');
            formData.append('name', fileName);
            const record = await pb.collection('ndas').create(formData);
            const fileUrl = `https://hackathon24.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.file}`;
            console.log('File URL:', fileUrl);
            // Optionally, show success or reset state here
>>>>>>> a8d5a9fe53f4afe3b0fbc75e25104c29cb57e806
        } catch (error) {
            console.error('Upload failed:', error);
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
            <Tabs defaultValue="file" className="w-full" onValueChange={(value) => setInputType(value as 'file' | 'text')}>
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

                <TabsContent value="file">
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
                            className="rounded-lg border-2 border-dashed border-gray-300 h-48 p-10 bg-black/80 hover:bg-black/60 transition-colors duration-150 flex items-center justify-center"
                        >
                            <div className="text-center">
                                <p className="text-sm text-gray-400">
                                    Drag and drop files here, or click to select files
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Supported formats: PDF, DOCX, DOC, TXT
                                </p>
                            </div>
                        </FileDropzone>
                    )}
                </TabsContent>

                <TabsContent value="text">
                    <Label htmlFor="text" className="mb-2 block text-sm text-white">Text Input</Label>
                    <Textarea
                        id="text"
                        value={freeText}
                        onChange={(e) => setFreeText(e.target.value)}
                        placeholder="Enter your text here..."
                        className="min-h-[200px] bg-black/80 border-gray-300"
                    />
                </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-6">
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
                    disabled={isLoading || (files.length === 0 && !freeText) || selectedDocs.length === 0}
                    onClick={handleCompare}
                >
                    {isLoading ? 'Processing...' : 'Compare'}
                </Button>
            </div>
        </div>
    );
}