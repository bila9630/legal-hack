"use client";

import { useState, FC } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import FileDropzone from "@/components/file-dropzone";
import { pb } from '@/lib/pocketbase';

interface UploadFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const UploadFileModal: FC<UploadFileModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCancel = () => {
        setFiles([]);
        setName("");
        setError(null);
        setIsLoading(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!files.length) {
            setError("Please select a file to upload.");
            return;
        }
        setIsLoading(true);
        try {
            const file = files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', name || file.name.replace(/\.[^/.]+$/, ""));
            formData.append('type', 'NDA');
            const record = await pb.collection('ndas').create(formData);
            const fileUrl = `https://hackathon24.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.file}`;
            console.log('File URL:', fileUrl);

            try {
                const response = await fetch('/api/create-summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recordId: record.id, fileUrl }),
                });
                if (!response.ok) {
                    throw new Error('Failed to create summary');
                }
            } catch (apiErr) {
                setError('Failed to create summary.');
                setIsLoading(false);
                return;
            }

            handleCancel();
            onSuccess?.();
        } catch (err) {
            setError('Upload failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="file">File</Label>
                        <FileDropzone
                            files={files}
                            setFiles={setFiles}
                            acceptedFileTypes={{
                                'application/pdf': ['.pdf'],
                                'text/plain': ['.txt'],
                                'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                            }}
                            className="rounded-lg border-2 border-dashed p-4 text-center cursor-pointer"
                        >
                            <div className="text-center">
                                {files.length > 0 ? (
                                    <span className="text-sm">{files[0].name}</span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        Drag and drop files here, or click to select files
                                    </span>
                                )}
                            </div>
                        </FileDropzone>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name (Optional)</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter file name"
                        />
                    </div>
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="secondary" onClick={handleCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !files.length}>
                            {isLoading ? (
                                <>
                                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 