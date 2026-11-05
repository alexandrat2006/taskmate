import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import { listRouter } from './routes/lists.js';

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/courses', listRouter('courses', ['name', 'color']));
app.use('/api/categories', listRouter('categories', ['name']));

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`TaskMate API running on http://localhost:${port}`));
