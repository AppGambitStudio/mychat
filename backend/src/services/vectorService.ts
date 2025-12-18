import { RecursiveCharacterTextSplitter } from '../utils/textSplitter';
import DocumentChunk from '../models/DocumentChunk';
import { generateEmbedding } from './aiService';

export const processAndStoreDocument = async (
    documentId: string,
    chatSpaceId: string,
    content: string
) => {
    // 1. Split content using RecursiveCharacterTextSplitter
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    });

    const chunks = await splitter.splitText(content);

    // 2. Generate embeddings and store
    for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i];
        const embedding = await generateEmbedding(chunkContent);

        await DocumentChunk.create({
            document_id: documentId,
            chat_space_id: chatSpaceId,
            content: chunkContent,
            token_count: Math.ceil(chunkContent.length / 4), // Rough estimate
            embedding: embedding,
            chunk_index: i,
        });
    }
};

// Helper function to calculate cosine similarity
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
};

export const searchSimilarChunks = async (
    chatSpaceId: string,
    queryText: string,
    limit: number = 5
) => {
    const queryEmbedding = await generateEmbedding(queryText);

    // Fetch all chunks for the chat space (inefficient for large datasets, but fine for MVP/SQLite)
    const chunks = await DocumentChunk.findAll({
        where: { chat_space_id: chatSpaceId },
        attributes: ['id', 'content', 'embedding']
    });

    // Calculate similarity in-memory
    const scoredChunks = chunks.map(chunk => {
        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
            id: chunk.id,
            content: chunk.content,
            similarity
        };
    });

    // Sort by similarity descending and take top N
    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    return scoredChunks.slice(0, limit);
};
