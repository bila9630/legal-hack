"use client";

interface Post {
    id: string;
    title: string;
    description: string;
    created: string;
    updated: string;
}

interface PostsProps {
    posts: Post[];
    toolCallId: string;
    success: boolean;
}

export function Posts({ posts, toolCallId, success }: PostsProps) {
    if (!success) {
        return (
            <div key={toolCallId} className="p-4 rounded-lg w-full bg-red-100 text-red-900">
                Failed to load posts
            </div>
        );
    }

    return (
        <div key={toolCallId} className="w-full space-y-4">
            {posts.map((post) => (
                <div key={post.id} className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-white">{post.title}</h3>
                        <span className="text-xs text-slate-400">
                            {new Date(post.created).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-sm text-slate-300">{post.description}</p>
                </div>
            ))}
        </div>
    );
} 