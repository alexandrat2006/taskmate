import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const DEFAULT_CATEGORIES = ['Homework', 'Exam', 'Project', 'Lab', 'Reading'];

const sign = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must have at least 6 characters' });

  try {
    const mail = email.trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [mail]);
    if (existing.length) return res.status(409).json({ error: 'Email is already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), mail, hash]
    );
    await pool.query('INSERT INTO categories (user_id, name) VALUES ?', [
      DEFAULT_CATEGORIES.map((c) => [result.insertId, c]),
    ]);

    const user = { id: result.insertId, name: name.trim(), email: mail };
    res.status(201).json({ token: sign(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Wrong email or password' });

    res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

export default router;
