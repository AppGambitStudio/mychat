
import { sequelize } from './src/config/database';
import Document from './src/models/Document';
import ChatSpace from './src/models/ChatSpace';

const testCreate = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        const chatSpace = await ChatSpace.findOne();
        if (!chatSpace) {
            console.log('No chat space found');
            return;
        }

        console.log('Found chat space:', chatSpace.id);

        const textContent = "This is a test manual entry with more than five words to check truncation.";
        const fileName = textContent.split(/\s+/).slice(0, 5).join(' ') + '...';

        console.log('Creating document with:', { fileName, textContent });

        const doc = await Document.create({
            chat_space_id: chatSpace.id,
            type: 'text',
            source_url: '',
            file_name: fileName,
            file_size: textContent.length,
            text_content: textContent,
            status: 'pending'
        });

        console.log('Document created:', doc.id, doc.file_name);

    } catch (error) {
        console.error('Create failed:', error);
    } finally {
        await sequelize.close();
    }
};

testCreate();
