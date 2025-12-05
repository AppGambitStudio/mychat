import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import Settings from '../models/Settings';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: any, res) => {
    try {
        const userId = req.user.id;
        let settings = await Settings.findOne({ where: { userId } });
        if (!settings) {
            settings = await Settings.create({ userId, kbConnectorActive: false });
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { responseTone, kbConnectorUrl, kbConnectorApiKey, kbConnectorActive } = req.body;

        let settings = await Settings.findOne({ where: { userId } });
        if (!settings) {
            settings = await Settings.create({
                userId,
                responseTone,
                kbConnectorUrl,
                kbConnectorApiKey,
                kbConnectorActive
            });
        } else {
            await settings.update({
                responseTone,
                kbConnectorUrl,
                kbConnectorApiKey,
                kbConnectorActive
            });
        }
        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
