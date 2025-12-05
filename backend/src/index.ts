import app from './app';
import { sequelize } from './config/database';

const PORT = process.env.PORT || 6002;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Sync models (use { force: true } only for development/reset)
        await sequelize.sync();
        console.log('Database synced');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();

// Keep process alive hack
setInterval(() => { }, 1000 * 60 * 60);
