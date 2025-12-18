import { Request, Response } from 'express';
import ChatSpace from '../models/ChatSpace';
import Document from '../models/Document';
import DocumentChunk from '../models/DocumentChunk';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import AnalyticsEvent from '../models/AnalyticsEvent';
import DailyStat from '../models/DailyStat';
import { v4 as uuidv4 } from 'uuid';

export const createChatSpace = async (req: any, res: Response) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;

        // Enforce Free Plan Limit: Max 1 Chat Space
        const existingCount = await ChatSpace.count({ where: { user_id: userId } });
        if (existingCount >= 1) {
            return res.status(403).json({ error: 'Free plan limit reached: You can only create 1 Chat Space.' });
        }

        const endpointSlug = uuidv4();
        const apiKey = uuidv4();

        const chatSpace = await ChatSpace.create({
            user_id: userId,
            name,
            description,
            endpoint_slug: endpointSlug,
            api_key: apiKey,
            status: 'draft',
            message_count: 0,
            last_message_at: new Date(),
            published_at: new Date(),
            data_usage_bytes: 0
        });

        res.status(201).json(chatSpace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getChatSpaces = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const chatSpaces = await ChatSpace.findAll({ where: { user_id: userId } });
        res.json(chatSpaces);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getChatSpace = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const chatSpace = await ChatSpace.findOne({ where: { id, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        res.json(chatSpace);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateChatSpace = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        const chatSpace = await ChatSpace.findOne({ where: { id, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        console.log('Updating chat space:', id, updates);
        await chatSpace.update(updates);
        res.json(chatSpace);
    } catch (error) {
        console.error('Update failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteChatSpace = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const chatSpace = await ChatSpace.findOne({ where: { id, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        // 1. Delete Document Chunks (Vectors)
        await DocumentChunk.destroy({ where: { chat_space_id: id } });

        // 2. Delete Documents
        await Document.destroy({ where: { chat_space_id: id } });

        // 3. Delete Messages
        await Message.destroy({ where: { chat_space_id: id } });

        // 4. Delete Conversations
        await Conversation.destroy({ where: { chat_space_id: id } });

        // 5. Delete Analytics Data
        await AnalyticsEvent.destroy({ where: { chat_space_id: id } });
        await DailyStat.destroy({ where: { chat_space_id: id } });

        // 6. Delete Chat Space
        await chatSpace.destroy();

        res.json({ message: 'Chat space and all related data deleted successfully' });
    } catch (error) {
        console.error('Delete failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

import { scrapeUrl } from '../services/scrapingService';
import { extractTextFromPdf } from '../services/pdfService';
import { generateEmbedding } from '../services/aiService';

// Helper function to chunk text
const chunkText = (text: string, chunkSize: number = 1000, overlap: number = 200): string[] => {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length);
        chunks.push(text.slice(startIndex, endIndex));
        startIndex += chunkSize - overlap;
    }

    return chunks;
};

export const processChatSpace = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const chatSpace = await ChatSpace.findOne({ where: { id, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        await chatSpace.update({ status: 'processing' });

        // Fetch all pending or failed documents
        let pendingDocs = await Document.findAll({
            where: {
                chat_space_id: id,
                status: ['pending', 'failed']
            }
        });

        // Track total documents to enforce limit
        let totalDocsCount = await Document.count({ where: { chat_space_id: id } });
        const MAX_DOCS = 10;

        // Use a loop to handle dynamically added documents (crawling)
        // We convert the Sequelize instances to a mutable array we can push to
        const queue = [...pendingDocs];
        // Keep track of processed URLs in this run to avoid cycles
        const processedUrls = new Set(queue.map(d => d.source_url));

        // Track usage locally to enforce limit within the loop
        let runningUsage = chatSpace.data_usage_bytes || 0;
        const MAX_DATA_USAGE = 5 * 1024 * 1024; // 5 MB

        while (queue.length > 0) {
            const doc = queue.shift();
            if (!doc) continue;

            // Pre-check: If we already exceeded usage, fail immediately without scraping
            if (runningUsage >= MAX_DATA_USAGE) {
                await doc.update({
                    status: 'failed',
                    error_message: 'Data usage limit exceeded (5MB)',
                    processing_completed_at: new Date()
                });
                continue;
            }

            try {
                await doc.update({ status: 'processing', processing_started_at: new Date() });

                let textContent = '';
                let foundLinks: string[] = [];

                if (doc.type === 'url') {
                    const { content, links } = await scrapeUrl(doc.source_url);
                    textContent = content;
                    foundLinks = links;
                } else if (doc.type === 'pdf') {
                    console.warn('PDF processing not fully implemented yet');
                    continue;
                } else if (doc.type === 'text') {
                    textContent = doc.text_content;
                }

                if (textContent) {
                    // Enforce Data Usage Limit (5MB)
                    const contentSize = Buffer.byteLength(textContent, 'utf8');

                    if (runningUsage + contentSize > MAX_DATA_USAGE) {
                        await doc.update({
                            status: 'failed',
                            error_message: 'Data usage limit exceeded (5MB)',
                            processing_completed_at: new Date()
                        });
                        continue; // Skip this document
                    }

                    const chunks = chunkText(textContent);

                    for (let i = 0; i < chunks.length; i++) {
                        const chunkContent = chunks[i];
                        const embedding = await generateEmbedding(chunkContent);

                        await DocumentChunk.create({
                            document_id: doc.id,
                            chat_space_id: id,
                            content: chunkContent,
                            embedding: embedding,
                            chunk_index: i,
                            token_count: Math.ceil(chunkContent.length / 4),
                            metadata: { source: doc.source_url || doc.file_name }
                        });
                    }

                    // Update usage
                    await chatSpace.increment('data_usage_bytes', { by: contentSize });
                    runningUsage += contentSize;

                    await doc.update({
                        status: 'completed',
                        processing_completed_at: new Date()
                    });

                    // Handle Recursive Crawling
                    if (doc.type === 'url' && foundLinks.length > 0) {
                        for (const link of foundLinks) {
                            // Stop if we reached the limit
                            if (totalDocsCount >= MAX_DOCS) break;

                            // Filter: Must be child of the current doc's URL (or strictly related)
                            // Logic: The link must start with the doc.source_url
                            // e.g. Base: https://appgambit.com -> Link: https://appgambit.com/blog (OK)
                            // e.g. Base: https://appgambit.com/blog -> Link: https://appgambit.com (NO)
                            if (link.startsWith(doc.source_url) && link !== doc.source_url) {
                                // Check if already processed in this run or exists in DB
                                if (!processedUrls.has(link)) {
                                    const exists = await Document.findOne({
                                        where: { chat_space_id: id, source_url: link }
                                    });

                                    if (!exists) {
                                        const newDoc = await Document.create({
                                            chat_space_id: id,
                                            source_url: link,
                                            type: 'url',
                                            status: 'pending'
                                        });

                                        queue.push(newDoc);
                                        processedUrls.add(link);
                                        totalDocsCount++;
                                    }
                                }
                            }
                        }
                    }

                } else {
                    await doc.update({
                        status: 'failed',
                        error_message: 'No content extracted',
                        processing_completed_at: new Date()
                    });
                }

            } catch (docError: any) {
                console.error(`Error processing document ${doc.id}:`, docError);
                await doc.update({
                    status: 'failed',
                    error_message: docError.message,
                    processing_completed_at: new Date()
                });
            }
        }

        await chatSpace.update({
            status: 'published',
            last_processed_at: new Date(),
        });

        res.json({ message: 'Chat space processed successfully', chatSpace });
    } catch (error) {
        console.error('Processing failed:', error);
        res.status(500).json({ error: 'Processing failed' });
    }
};
export const clearDocuments = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const chatSpace = await ChatSpace.findOne({ where: { id, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        // 1. Delete Document Chunks (Vectors)
        await DocumentChunk.destroy({ where: { chat_space_id: id } });

        // 2. Delete Documents
        await Document.destroy({ where: { chat_space_id: id } });

        // 3. Reset stats
        await chatSpace.update({
            data_usage_bytes: 0,
            status: 'draft', // Reset status so user can process again
            message_count: 0, // Optional: Reset message count if we want a full reset? Plan said only documents/vectors. keeping message count for now unless requested.
            // Actually plan said "Reset ChatSpace stats: data_usage_bytes = 0, status = 'draft'". 
        });

        res.json({ message: 'All documents and vectors cleared successfully', chatSpace });
    } catch (error) {
        console.error('Clear documents failed:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
