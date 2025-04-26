import { tool } from "ai";
import { z } from "zod";
import { pb } from "@/lib/pocketbase";

export const getWeather = tool({
    description: "Get the current weather for a given location",
    parameters: z.object({
        location: z.string().describe("The location to get the weather for"),
    }),
    execute: async ({ location }) => {
        const weatherTypes = ["Sunny", "Rainy"];
        const randomTemp = Math.floor(Math.random() * (35 - -5)) + -5; // Random temp between -5 and 35°C
        const randomWeather =
            weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

        return {
            location,
            temperature: randomTemp,
            weather: randomWeather,
        };
    },
})

export const getPosts = tool({
    description: "Get all posts from the database",
    parameters: z.object({}),
    execute: async () => {
        try {
            const records = await pb.collection('posts').getFullList({
                sort: '-created',
            });

            return {
                success: true,
                posts: records,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch posts',
            };
        }
    },
});

export const createPost = tool({
    description: "Create a new post in the database",
    parameters: z.object({
        title: z.string().describe("The title of the post"),
        description: z.string().describe("The description/content of the post"),
    }),
    execute: async ({ title, description }) => {
        try {
            const data = {
                title,
                description,
            };

            const record = await pb.collection('posts').create(data);

            return {
                success: true,
                post: record,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create post',
            };
        }
    },
});

export const tools = {
    getWeather,
    getPosts,
    createPost,
};