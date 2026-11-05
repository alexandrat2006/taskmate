import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

// Whitelisted ORDER BY clauses (user input is never interpolated into SQL)
const SORTS = {
  deadline: 't.deadline IS NULL, t.deadline',
  priority: "FIELD(t.priority, 'high', 'medium', 'low')",
  created: 't.created_at',
  title: 't.title',
};

const SELECT = `
  SELECT t.*, c.name AS course_name, c.color AS course_color, g.name AS category_name
  FROM tasks t
  LEFT JOIN courses c    ON c.id = t.course_id
  LEFT JOIN categories g ON g.id = t.category_id`;

/**
 * GET /api/tasks?status=&course_id=&category_id=&priority=&q=&due=&sort=&order=
 *   status = todo | in_progress | done | open (anything not done)
 *   due    = overdue | today | week
 *   sort   = deadline | priority | created | title
 */
router.get('/', async (req, res) => {
  const { status, course_id, category_id, priority, q, due, sort = 'deadline', order = 'asc' } = req.query;
  const where = ['t.user_id = ?'];
  const params = [req.userId];

  if (STATUSES.includes(status)) { where.push('t.status = ?'); params.push(status); }
  if (status === 'open') where.push("t.status <> 'done'");
  if (course_id) { where.push('t.course_id = ?'); params.push(course_id); }
  if (category_id) { where.push('t.category_id = ?'); params.push(category_id); }
  if (PRIORITIES.includes(priority)) { where.push('t.priority = ?'); params.push(priority); }
  if (q) { where.push('(t.title LIKE ? OR t.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (due === 'overdue') where.push("t.deadline < CURDATE() AND t.status <> 'done'");
  if (due === 'today') where.push('t.deadline = CURDATE()');
  if (due === 'week') where.push('t.deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)');

  const orderBy = SORTS[sort] || SORTS.deadline;
  const dir = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    const [rows] = await pool.query(
      `${SELECT} WHERE ${where.join(' AND ')} ORDER BY ${orderBy} ${dir}, t.id DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load tasks' });
  }
});

router.get('/stats', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(status = 'done') AS done,
            SUM(status <> 'done' AND deadline < CURDATE()) AS overdue,
            SUM(status <> 'done' AND deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS due_this_week
     FROM tasks WHERE user_id = ?`,
    [req.userId]
  );
  const s = rows[0];
  res.json({
    total: +s.total,
    done: +(s.done || 0),
    overdue: +(s.overdue || 0),
    due_this_week: +(s.due_this_week || 0),
  });
});

function clean(body) {
  const out = {};
  if (body.title !== undefined) out.title = String(body.title).trim();
  if (body.description !== undefined) out.description = body.description || null;
  if (body.deadline !== undefined) out.deadline = body.deadline || null;
  if (body.course_id !== undefined) out.course_id = body.course_id || null;
  if (body.category_id !== undefined) out.category_id = body.category_id || null;
  if (PRIORITIES.includes(body.priority)) out.priority = body.priority;
  if (STATUSES.includes(body.status)) out.status = body.status;
  return out;
}

// Referenced course/category must belong to the current user
async function ownsRefs(userId, { course_id, category_id }) {
  if (course_id) {
    const [r] = await pool.query('SELECT id FROM courses WHERE id = ? AND user_id = ?', [course_id, userId]);
    if (!r.length) return false;
  }
  if (category_id) {
    const [r] = await pool.query('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, userId]);
    if (!r.length) return false;
  }
  return true;
}

router.post('/', async (req, res) => {
  const data = clean(req.body);
  if (!data.title) return res.status(400).json({ error: 'Title is required' });
  if (!(await ownsRefs(req.userId, data))) return res.status(400).json({ error: 'Invalid course or category' });

  const cols = ['user_id', ...Object.keys(data)];
  const [r] = await pool.query(
    `INSERT INTO tasks (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
    [req.userId, ...Object.values(data)]
  );
  const [rows] = await pool.query(`${SELECT} WHERE t.id = ?`, [r.insertId]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const data = clean(req.body);
  if (!Object.keys(data).length) return res.status(400).json({ error: 'Nothing to update' });
  if (data.title === '') return res.status(400).json({ error: 'Title cannot be empty' });
  if (!(await ownsRefs(req.userId, data))) return res.status(400).json({ error: 'Invalid course or category' });

  const [r] = await pool.query(
    `UPDATE tasks SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
    [...Object.values(data), req.params.id, req.userId]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Task not found' });
  const [rows] = await pool.query(`${SELECT} WHERE t.id = ?`, [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const [r] = await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});

export default router;
