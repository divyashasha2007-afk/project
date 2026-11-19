import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = Router();
const makeToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email });

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must contain at least 6 characters' });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashed });
    res.status(201).json({ token: makeToken(user._id), user: safeUser(user) });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Incorrect email or password' });
    res.json({ token: makeToken(user._id), user: safeUser(user) });
  } catch (err) { next(err); }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: safeUser(user) });
  } catch (err) { next(err); }
});

export default router;
