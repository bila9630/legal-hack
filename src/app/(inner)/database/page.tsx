'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UploadFileModal } from "@/components/UploadFileModal";
import { pb } from '@/lib/pocketbase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useRouter } from 'next/navigation';

export default function DatabasePage() {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const router = useRouter();

    const fetchRecords = async () => {
        const records = await pb.collection('ndas').getFullList({
            sort: '-created',
        });
        setRecords(records);
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleRowClick = (record: any) => {
        router.push(`/nda-detail/${record.id}`);
    };

    return (
        <div className="w-full max-w-[95%] mx-auto px-2 sm:px-4 py-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Explorer</h1>
                <Button
                    variant="default"
                    size="lg"
                    onClick={() => setIsUploadModalOpen(true)}
                >
                    Upload file
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>File</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record) => (
                        <TableRow
                            key={record.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleRowClick(record)}
                        >
                            <TableCell>{record.name}</TableCell>
                            <TableCell>{record.type}</TableCell>
                            <TableCell className="max-w-md truncate">
                                {record.summary || 'No summary available'}
                            </TableCell>
                            <TableCell>
                                {new Date(record.created).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                <a
                                    href={`https://hackathon24.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.file}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View PDF
                                </a>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <UploadFileModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={fetchRecords}
            />
        </div>
    );
} 