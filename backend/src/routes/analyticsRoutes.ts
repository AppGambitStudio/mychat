import { Router } from 'express';
import { trackEvent } from '../controllers/analyticsController';

const router = Router();

router.post('/events', trackEvent);

export default router;
