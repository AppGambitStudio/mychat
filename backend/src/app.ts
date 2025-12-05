import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

import routes from './routes';
app.use('/api', routes);

export default app;
