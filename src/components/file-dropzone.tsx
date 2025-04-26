"use client";
import { cn } from "@/lib/utils";
import type { FC } from "react";
import { Accept, useDropzone } from "react-dropzone";

interface FileDropzoneProps {
    files: File[]; // Keep as array for consistency
    setFiles: (files: File[]) => void;
    acceptedFileTypes?: Accept;
    children: React.ReactNode;
    className?: string;
}

const DEFAULT_ACCEPTED_TYPES: Accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.ms-word': ['.doc'],
    'application/x-msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
};

const FileDropzone: FC<FileDropzoneProps> = ({ 
    files, 
    setFiles, 
    acceptedFileTypes = DEFAULT_ACCEPTED_TYPES, 
    children, 
    className 
}) => {
    const onDrop = (acceptedFiles: File[]) => {
        // Only take the first file
        const newFile = acceptedFiles[0];
        if (newFile) {
            console.log('Accepted file:', {
                name: newFile.name,
                type: newFile.type,
                size: newFile.size
            });
            setFiles([newFile]); // Replace existing files with new single file
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFileTypes,
        multiple: false, // Set multiple to false to only allow single file
        validator: (file) => {
            // Additional validation for file extensions
            const ext = file.name.toLowerCase().split('.').pop();
            if (ext === 'doc' || ext === 'docx' || ext === 'pdf' || ext === 'txt') {
                return null; // File is valid
            }
            return {
                code: 'file-invalid-type',
                message: 'File type not supported'
            };
        }
    });

    return (
        <div className={cn(isDragActive && "bg-muted", className)} {...getRootProps()}>
            <input {...getInputProps()} />
            {children}
        </div>
    );
};

export default FileDropzone;
