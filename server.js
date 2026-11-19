import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'TaskFlow API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGODB_URI or JWT_SECRET in environment');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`API listening on ${PORT}`)))
  .catch((err) => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
