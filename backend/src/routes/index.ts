import { Router } from 'express';
import authRoutes from './authRoutes';
import chatSpaceRoutes from './chatSpaceRoutes';
import documentRoutes from './documentRoutes';
import widgetRoutes from './widgetRoutes';
import settingsRoutes from './settingsRoutes';
import analyticsRoutes from './analyticsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat-spaces', chatSpaceRoutes);
router.use('/documents', documentRoutes);
router.use('/widget', widgetRoutes);
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
