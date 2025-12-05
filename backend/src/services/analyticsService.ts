import AnalyticsEvent from '../models/AnalyticsEvent';
import DailyStat from '../models/DailyStat';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';

export const logEvent = async (
    chat_space_id: string,
    event_type: 'widget_load' | 'chat_start' | 'message_sent' | 'feedback',
    anonymous_id?: string,
    metadata?: any
) => {
    try {
        // Update Daily Stats (Upsert)
        const today = new Date().toISOString().split('T')[0];

        // We use a transaction to ensure consistency
        await sequelize.transaction(async (t) => {
            let isUniqueUser = false;

            if (event_type === 'widget_load' && anonymous_id) {
                // Check unique user BEFORE creating the new event
                const existingEvent = await AnalyticsEvent.findOne({
                    where: {
                        chat_space_id,
                        event_type: 'widget_load',
                        anonymous_id,
                        created_at: {
                            [Op.gte]: new Date(today)
                        }
                    },
                    transaction: t
                });

                if (!existingEvent) {
                    isUniqueUser = true;
                }
            }

            // Create raw event
            await AnalyticsEvent.create({
                chat_space_id,
                event_type,
                anonymous_id,
                metadata
            }, { transaction: t });

            const [stat, created] = await DailyStat.findOrCreate({
                where: { chat_space_id, date: today },
                defaults: {
                    chat_space_id,
                    date: today,
                    total_loads: 0,
                    total_chats: 0,
                    total_messages: 0,
                    unique_users: 0
                },
                transaction: t
            });

            if (event_type === 'widget_load') {
                await stat.increment('total_loads', { transaction: t });
                if (isUniqueUser) {
                    await stat.increment('unique_users', { transaction: t });
                }
            } else if (event_type === 'chat_start') {
                await stat.increment('total_chats', { transaction: t });
            } else if (event_type === 'message_sent') {
                await stat.increment('total_messages', { transaction: t });
            }
        });
    } catch (error) {
        console.error('Error logging analytics event:', error);
        // Don't throw, we don't want to break the main flow for analytics
    }
};
