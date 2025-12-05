import { Router } from 'express';
import {
    createChatSpace,
    getChatSpaces,
    getChatSpace,
    updateChatSpace,
    deleteChatSpace,
    processChatSpace,
} from '../controllers/chatSpaceController';
import { upload } from '../middleware/uploadMiddleware';
import {
    getDocuments,
    createDocument,
    uploadDocument,
} from '../controllers/documentController';
import { getStats } from '../controllers/analyticsController';

import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', createChatSpace);
router.get('/', getChatSpaces);
router.get('/:id', getChatSpace);
router.patch('/:id', updateChatSpace);
router.delete('/:id', deleteChatSpace);
router.post('/:id/process', processChatSpace);

// Document routes nested under chat spaces
router.get('/:chatSpaceId/documents', getDocuments);
router.post('/:chatSpaceId/documents', createDocument); // For URL/Text
router.post('/:chatSpaceId/documents/upload', upload.single('file'), uploadDocument); // For Files

// Analytics
router.get('/:chatSpaceId/analytics', getStats);

export default router;
