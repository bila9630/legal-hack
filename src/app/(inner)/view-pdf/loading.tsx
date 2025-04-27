import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            Loading...
        </div>
    );
} 