import { sequelize } from '../config/database';
import ChatSpace from '../models/ChatSpace';

const resetConfig = async () => {
    try {
        await sequelize.authenticate();
        const chatSpaces = await ChatSpace.findAll();

        for (const cs of chatSpaces) {
            const config = cs.ai_config as any;
            if (config && config.systemPrompt === 'You are a helpful assistant.') {
                console.log(`Resetting config for: ${cs.name}`);
                const newConfig = { ...config };
                delete newConfig.systemPrompt;
                await cs.update({ ai_config: newConfig });
                console.log('  System prompt cleared.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

resetConfig();
