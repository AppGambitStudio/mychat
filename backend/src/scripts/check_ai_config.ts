import { sequelize } from '../config/database';
import ChatSpace from '../models/ChatSpace';

const checkConfig = async () => {
    try {
        await sequelize.authenticate();
        const chatSpaces = await ChatSpace.findAll();

        chatSpaces.forEach(cs => {
            const config = cs.ai_config as any;
            console.log(`ChatSpace: ${cs.name} (${cs.id})`);
            if (config && config.systemPrompt) {
                console.log('  Has custom system prompt:', config.systemPrompt);
            } else {
                console.log('  Using default system prompt');
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkConfig();
