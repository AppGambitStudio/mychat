import { Request, Response } from 'express';
import AnalyticsEvent from '../models/AnalyticsEvent';
import DailyStat from '../models/DailyStat';
import ChatSpace from '../models/ChatSpace';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { logEvent } from '../services/analyticsService';

export const trackEvent = async (req: Request, res: Response) => {
    try {
        const { chat_space_id, event_type, anonymous_id, metadata } = req.body;

        if (!chat_space_id || !event_type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate event type
        const validEvents = ['widget_load', 'chat_start', 'message_sent', 'feedback'];
        if (!validEvents.includes(event_type)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }

        await logEvent(chat_space_id, event_type, anonymous_id, metadata);

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getStats = async (req: any, res: Response) => {
    try {
        const { chatSpaceId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const chatSpace = await ChatSpace.findOne({ where: { id: chatSpaceId, user_id: userId } });
        if (!chatSpace) {
            return res.status(404).json({ error: 'Chat space not found' });
        }

        // Get last 30 days stats
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await DailyStat.findAll({
            where: {
                chat_space_id: chatSpaceId,
                date: {
                    [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0]
                }
            },
            order: [['date', 'ASC']]
        });

        // Aggregates
        const totalLoads = stats.reduce((sum, s) => sum + s.total_loads, 0);
        const totalChats = stats.reduce((sum, s) => sum + s.total_chats, 0);
        const totalMessages = stats.reduce((sum, s) => sum + s.total_messages, 0);
        const uniqueUsers = stats.reduce((sum, s) => sum + s.unique_users, 0);

        // Top Questions (from metadata)
        // This is expensive on large datasets, but fine for MVP
        const topQuestions = await AnalyticsEvent.findAll({
            attributes: [
                [sequelize.literal("metadata->>'question'") as any, 'question'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                chat_space_id: chatSpaceId,
                event_type: 'chat_start', // Assuming chat_start contains the first question or we track questions separately
                // Actually, let's look at 'message_sent' where role='user'
                // But we store raw events. Let's assume 'message_sent' from user has metadata.question
            },
            group: [sequelize.literal("metadata->>'question'") as any],
            order: [[sequelize.literal('count') as any, 'DESC']],
            limit: 5
        });

        res.json({
            daily: stats,
            aggregates: {
                totalLoads,
                totalChats,
                totalMessages,
                uniqueUsers
            },
            topQuestions
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
