"use client";
import type { Message } from "ai";
import { Posts } from "./posts";

export default function Message({ message }: { message: Message }) {
    if (message) {
        console.log("Message", message);
    }

    return (
        <div
            className={`flex gap-5 p-4 ${message.role === "assistant" ? "bg-gray-900 rounded-lg" : ""}`}
        >
            <div className="text-sm text-gray-500">
                {message.role === "user" ? "U" : "A"}
            </div>
            <div className="flex flex-col gap-4 flex-1">
                <div className="text-sm">{message.content}</div>

                {message.toolInvocations?.map((tool) => {
                    const { toolName, toolCallId, state } = tool;

                    if (state === "result") {
                        if (toolName === "getPosts") {
                            return <Posts key={toolCallId} toolCallId {...tool.result} />;
                        }
                    } else {
                        if (toolName === "getPosts") {
                            return <div key={toolCallId}>Loading posts...</div>;
                        }
                    }
                    return null;
                })}
            </div>
        </div>
    )
}
