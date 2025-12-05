import { Router } from 'express';
import {
    getDocuments,
    createDocument,
    getDocument,
    deleteDocument,
} from '../controllers/documentController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

// Routes nested under chat-spaces/:chatSpaceId/documents
// But for simplicity, we can define them here and use params or query
// However, standard REST usually nests or filters.
// Let's assume the router is mounted at /api/documents and we pass chatSpaceId in query or body for creation,
// OR we mount it under /api/chat-spaces/:chatSpaceId/documents.
// The spec says:
// GET    /api/chat-spaces/:id/documents       - List documents
// POST   /api/chat-spaces/:id/documents/upload - Upload PDF
// POST   /api/chat-spaces/:id/documents/url    - Add URL to scrape
// GET    /api/documents/:id                    - Get document details
// DELETE /api/documents/:id                    - Delete document

// So we need two routers or one router handling both paths.
// Let's create a router for /api/documents first.

router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

export default router;

// We also need to handle the nested routes in chatSpaceRoutes or a separate router mounted there.
