import { Router } from 'express';
import { handleChat, getWidgetConfig } from '../controllers/chatController';

const router = Router();

router.get('/:slug/config', getWidgetConfig);
router.post('/:slug/chat', handleChat);

export default router;
