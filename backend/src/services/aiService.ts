import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        'HTTP-Referer': 'https://mychat.com', // Replace with your site URL
        'X-Title': 'MyChat', // Replace with your site title
    },
});

export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        const response = await openai.embeddings.create({
            model: 'qwen/qwen3-embedding-4b',
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
};

export const generateChatResponse = async (
    messages: any[],
    config: { model?: string; apiKey?: string } = {}
): Promise<string> => {
    try {
        let client = openai;

        // If a custom API key is provided, create a new client instance
        if (config.apiKey) {
            client = new OpenAI({
                baseURL: 'https://openrouter.ai/api/v1',
                apiKey: config.apiKey,
                defaultHeaders: {
                    'HTTP-Referer': 'https://mychat.com',
                    'X-Title': 'MyChat',
                },
            });
        }

        const model = config.model || 'google/gemini-2.5-flash';

        const response = await client.chat.completions.create({
            model,
            messages,
        });
        return response.choices[0].message.content || '';
    } catch (error) {
        console.error('Error generating chat response:', error);
        throw new Error('Failed to generate chat response');
    }
};
