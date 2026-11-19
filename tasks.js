import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);
const allowed = ['title', 'description', 'dueDate', 'priority', 'status'];

function validate(body) {
  if (body.title !== undefined && !String(body.title).trim()) return 'Task title is required';
  if (body.priority !== undefined && !['Low', 'Medium', 'High'].includes(body.priority)) return 'Invalid priority';
  if (body.status !== undefined && !['Pending', 'In Progress', 'Completed'].includes(body.status)) return 'Invalid status';
  return null;
}

router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const task = await Task.create({
      title: req.body.title, description: req.body.description || '',
      dueDate: req.body.dueDate || null, priority: req.body.priority || 'Medium',
      status: req.body.status || 'Pending', user: req.userId
    });
    res.status(201).json({ task });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task ID' });
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task ID' });
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) { next(err); }
});

export default router;
