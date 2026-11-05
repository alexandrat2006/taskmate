import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import AuthPage from './components/AuthPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import TaskItem from './components/TaskItem.jsx';
import TaskModal from './components/TaskModal.jsx';

const DEFAULT_FILTERS = { status: 'open', course_id: '', category_id: '', priority: '', due: '', q: '', sort: 'deadline', order: 'asc' };

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setBooting(false));
  }, []);

  if (booting) return null;
  if (!user) return <AuthPage onAuth={setUser} />;
  return <Dashboard user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}

function Dashboard({ user, onLogout }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, done: 0, overdue: 0, due_this_week: 0 });
  const [modal, setModal] = useState(null); // null | {} (new) | task (edit)
  const [error, setError] = useState('');

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const loadSide = useCallback(async () => {
    const [c, g, s] = await Promise.all([api.courses(), api.categories(), api.stats()]);
    setCourses(c); setCategories(g); setStats(s);
  }, []);

  const loadTasks = useCallback(async () => {
    try { setTasks(await api.tasks(filters)); setError(''); }
    catch (e) { setError(e.message); }
  }, [filters]);

  useEffect(() => { loadSide(); }, [loadSide]);
  // small debounce so the search box doesn't hit the API on every keystroke
  useEffect(() => { const t = setTimeout(loadTasks, 200); return () => clearTimeout(t); }, [loadTasks]);

  const refresh = () => Promise.all([loadTasks(), loadSide()]);

  async function saveTask(form) {
    const body = { ...form, course_id: form.course_id || null, category_id: form.category_id || null, deadline: form.deadline || null };
    if (modal?.id) await api.updateTask(modal.id, body); else await api.createTask(body);
    setModal(null);
    refresh();
  }

  const changeStatus = async (task, status) => { await api.updateTask(task.id, { status }); refresh(); };
  const removeTask = async (task) => {
    if (window.confirm(`Delete "${task.title}"?`)) { await api.deleteTask(task.id); refresh(); }
  };

  const actions = {
    addCourse: async (b) => { try { await api.createCourse(b); loadSide(); } catch (e) { setError(e.message); } },
    addCategory: async (b) => { try { await api.createCategory(b); loadSide(); } catch (e) { setError(e.message); } },
    deleteCourse: async (c) => {
      if (window.confirm(`Delete course "${c.name}"? Its tasks stay, without a course.`)) {
        await api.deleteCourse(c.id);
        if (filters.course_id === String(c.id)) setFilter('course_id', '');
        refresh();
      }
    },
    deleteCategory: async (c) => {
      if (window.confirm(`Delete category "${c.name}"? Its tasks stay, without a category.`)) {
        await api.deleteCategory(c.id);
        if (filters.category_id === String(c.id)) setFilter('category_id', '');
        refresh();
      }
    },
  };

  const quick = [
    ['Open', { status: 'open', due: '' }],
    ['Overdue', { status: 'open', due: 'overdue' }],
    ['Due today', { status: 'open', due: 'today' }],
    ['Next 7 days', { status: 'open', due: 'week' }],
    ['Done', { status: 'done', due: '' }],
    ['All', { status: '', due: '' }],
  ];
  const isQuick = (p) => filters.status === p.status && filters.due === p.due;

  return (
    <div className="layout">
      <Sidebar user={user} stats={stats} courses={courses} categories={categories}
               filters={filters} setFilter={setFilter} actions={actions} onLogout={onLogout} />

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Your tasks</h1>
            <p className="sub">
              {stats.due_this_week} due in the next 7 days{stats.overdue ? `, ${stats.overdue} overdue` : ''}
            </p>
          </div>
          <button className="btn primary" onClick={() => setModal({})}>New task</button>
        </header>

        <div className="chips" role="group" aria-label="Quick filters">
          {quick.map(([label, p]) => (
            <button key={label} className={`chip ${isQuick(p) ? 'on' : ''}`}
                    onClick={() => setFilters((f) => ({ ...f, ...p }))}>{label}</button>
          ))}
        </div>

        <div className="toolbar">
          <input type="search" placeholder="Search tasks" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} aria-label="Search tasks" />
          <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Filter by priority">
            <option value="">Any priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort by">
            <option value="deadline">Sort: deadline</option><option value="priority">Sort: priority</option>
            <option value="created">Sort: date added</option><option value="title">Sort: title</option>
          </select>
          <button className="btn" onClick={() => setFilter('order', filters.order === 'asc' ? 'desc' : 'asc')}
                  aria-label="Toggle sort direction">{filters.order === 'asc' ? 'Ascending' : 'Descending'}</button>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        {tasks.length === 0 ? (
          <div className="empty">
            <p>No tasks match these filters.</p>
            <button className="btn primary" onClick={() => setModal({})}>Add a task</button>
          </div>
        ) : (
          <ul className="tasks">
            {tasks.map((t) => (
              <TaskItem key={t.id} task={t} onStatus={changeStatus} onEdit={setModal} onDelete={removeTask} />
            ))}
          </ul>
        )}
      </main>

      {modal && (
        <TaskModal task={modal.id ? modal : null} courses={courses} categories={categories}
                   onSave={saveTask} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
