import { Request, Response } from 'express';
import Document from '../models/Document';
import ChatSpace from '../models/ChatSpace';

export const getDocuments = async (req: any, res: Response) => {
    try {
        const { chatSpaceId } = req.params;
        const userId = req.user.id;

        const chatSpace = await ChatSpace.findOne({ where: { id: chatSpaceId, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        const documents = await Document.findAll({
            where: { chat_space_id: chatSpaceId },
            order: [['created_at', 'DESC']]
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createDocument = async (req: any, res: Response) => {
    try {
        const { chatSpaceId } = req.params;
        const { type, source_url, file_name, file_size } = req.body;
        console.log('Creating document:', { type, source_url, file_name_length: file_name?.length, text_content_length: req.body.text_content?.length });
        const userId = req.user.id;

        const chatSpace = await ChatSpace.findOne({ where: { id: chatSpaceId, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        // Enforce Free Plan Limits
        if (type === 'url') {
            const urlCount = await Document.count({ where: { chat_space_id: chatSpaceId, type: 'url' } });
            if (urlCount >= 10) {
                return res.status(403).json({ error: 'Free plan limit reached: Max 10 URLs per Chat Space.' });
            }
        } else if (type === 'pdf') {
            const pdfCount = await Document.count({ where: { chat_space_id: chatSpaceId, type: 'pdf' } });
            if (pdfCount >= 2) {
                return res.status(403).json({ error: 'Free plan limit reached: Max 2 PDFs per Chat Space.' });
            }
        }

        const document = await Document.create({
            chat_space_id: chatSpaceId,
            type,
            source_url,
            file_name,
            file_size,
            text_content: req.body.text_content, // Save manual text content
            status: 'pending',
        });

        // TODO: Trigger background processing job here

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

import { parseDocument } from '../services/documentParser';

export const uploadDocument = async (req: any, res: Response) => {
    try {
        const { chatSpaceId } = req.params;
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const chatSpace = await ChatSpace.findOne({ where: { id: chatSpaceId, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        // Enforce Free Plan Limits (Generic "file" limit for now)
        // We treat all uploaded files (PDF, DOCX, etc.) under the same limit or separate?
        // For simplicity, let's just check total document count or specific type count.
        // Let's stick to the "PDF" limit logic but rename it conceptually to "Documents" limit.
        const docCount = await Document.count({
            where: {
                chat_space_id: chatSpaceId,
                type: ['pdf', 'docx', 'txt', 'md', 'html']
            }
        });

        if (docCount >= 5) { // Increased limit slightly for testing multiple types
            return res.status(403).json({ error: 'Free plan limit reached: Max 5 documents per Chat Space.' });
        }

        // Parse Document
        let textContent = '';
        try {
            textContent = await parseDocument(file);
        } catch (err) {
            return res.status(400).json({ error: 'Failed to parse document. Ensure it is a valid file.' });
        }

        // Determine type from extension
        const ext = file.originalname.split('.').pop()?.toLowerCase() || 'txt';
        const type = ['pdf', 'docx', 'html', 'md', 'txt'].includes(ext) ? ext : 'txt';

        const document = await Document.create({
            chat_space_id: chatSpaceId,
            type: type, // We might need to update the ENUM in Postgres if it's strict
            source_url: '',
            file_name: file.originalname,
            file_size: file.size,
            text_content: textContent, // Save parsed text directly
            status: 'completed', // We already parsed it!
        });

        res.status(201).json(document);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getDocument = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const document = await Document.findByPk(id, { include: [{ model: ChatSpace, where: { user_id: userId } }] });
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteDocument = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const document = await Document.findByPk(id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const chatSpace = await ChatSpace.findOne({ where: { id: document.chat_space_id, user_id: userId } });
        if (!chatSpace) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await document.destroy();
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
