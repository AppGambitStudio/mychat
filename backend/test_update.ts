
import { sequelize } from './src/config/database';
import ChatSpace from './src/models/ChatSpace';

const testUpdate = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        const chatSpace = await ChatSpace.findOne();
        if (!chatSpace) {
            console.log('No chat space found');
            return;
        }

        console.log('Found chat space:', chatSpace.id, chatSpace.widget_status);

        const newStatus = chatSpace.widget_status === 'testing' ? 'live' : 'testing';
        console.log('Attempting to update to:', newStatus);

        await chatSpace.update({ widget_status: newStatus });
        console.log('Update successful. New status:', chatSpace.widget_status);

    } catch (error) {
        console.error('Update failed:', error);
    } finally {
        await sequelize.close();
    }
};

testUpdate();
