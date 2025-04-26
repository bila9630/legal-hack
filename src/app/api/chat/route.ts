import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { tools } from "@/ai/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: openai("gpt-4o-mini"),
        system: "You are a helpful assistant.",
        messages,
        tools,
        maxSteps: 3
    })

    return result.toDataStreamResponse();
}