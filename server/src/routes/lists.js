import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Builds a router for the small "owned lists" (courses, categories).
 * Every query is scoped by user_id so users only ever see their own rows.
 * `table` and `fields` are hard-coded in index.js, never user input.
 */
export function listRouter(table, fields) {
  const router = Router();
  const fk = table === 'courses' ? 'course_id' : 'category_id';
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const [rows] = await pool.query(
      `SELECT t.*, (SELECT COUNT(*) FROM tasks k
                    WHERE k.${fk} = t.id AND k.status <> 'done') AS open_tasks
       FROM ${table} t WHERE t.user_id = ? ORDER BY t.name`,
      [req.userId]
    );
    res.json(rows);
  });

  router.post('/', async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const data = { name };
    fields.forEach((f) => { if (f !== 'name' && req.body[f] !== undefined) data[f] = req.body[f]; });
    try {
      const cols = ['user_id', ...Object.keys(data)];
      const [r] = await pool.query(
        `INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        [req.userId, ...Object.values(data)]
      );
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [r.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That name already exists' });
      console.error(err);
      res.status(500).json({ error: 'Could not save' });
    }
  });

  router.put('/:id', async (req, res) => {
    const sets = fields.filter((f) => req.body[f] !== undefined);
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    try {
      const [r] = await pool.query(
        `UPDATE ${table} SET ${sets.map((f) => `${f} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
        [...sets.map((f) => req.body[f]), req.params.id, req.userId]
      );
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json(rows[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That name already exists' });
      res.status(500).json({ error: 'Could not update' });
    }
  });

  router.delete('/:id', async (req, res) => {
    const [r] = await pool.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [req.params.id, req.userId]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  return router;
}
