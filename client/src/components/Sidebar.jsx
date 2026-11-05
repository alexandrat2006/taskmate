import { useState } from 'react';

const PALETTE = ['#3B6FD4', '#D6623F', '#2F8F5B', '#8A4FD1', '#C9961A', '#1E8FA8', '#C2417A'];

function AddRow({ placeholder, onAdd, withColor }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(withColor ? { name, color } : { name });
    setName('');
    if (withColor) setColor(PALETTE[(PALETTE.indexOf(color) + 1) % PALETTE.length]);
  }

  return (
    <form className="add-row" onSubmit={submit}>
      {withColor && (
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Course color" />
      )}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      <button className="btn small" aria-label="Add">Add</button>
    </form>
  );
}

export default function Sidebar({ user, stats, courses, categories, filters, setFilter, actions, onLogout }) {
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <aside className="sidebar">
      <div className="brand">TaskMate</div>

      <div className="progress" aria-label={`${pct}% of tasks done`}>
        <div className="progress-bar"><span style={{ width: `${pct}%` }} /></div>
        <p><strong>{stats.done}</strong> of {stats.total} done</p>
        {stats.overdue > 0 && <p className="late-note">{stats.overdue} overdue</p>}
      </div>

      <nav aria-label="Courses">
        <h3>Courses</h3>
        <button className={`nav-item ${!filters.course_id ? 'active' : ''}`} onClick={() => setFilter('course_id', '')}>
          All courses
        </button>
        {courses.map((c) => (
          <div key={c.id} className="nav-row">
            <button className={`nav-item ${filters.course_id === String(c.id) ? 'active' : ''}`}
                    onClick={() => setFilter('course_id', String(c.id))}>
              <i style={{ background: c.color }} />
              <span>{c.name}</span>
              <em>{c.open_tasks}</em>
            </button>
            <button className="x" onClick={() => actions.deleteCourse(c)} aria-label={`Delete ${c.name}`}>×</button>
          </div>
        ))}
        <AddRow placeholder="New course" withColor onAdd={actions.addCourse} />
      </nav>

      <nav aria-label="Categories">
        <h3>Categories</h3>
        <button className={`nav-item ${!filters.category_id ? 'active' : ''}`} onClick={() => setFilter('category_id', '')}>
          All categories
        </button>
        {categories.map((c) => (
          <div key={c.id} className="nav-row">
            <button className={`nav-item ${filters.category_id === String(c.id) ? 'active' : ''}`}
                    onClick={() => setFilter('category_id', String(c.id))}>
              <span>{c.name}</span>
              <em>{c.open_tasks}</em>
            </button>
            <button className="x" onClick={() => actions.deleteCategory(c)} aria-label={`Delete ${c.name}`}>×</button>
          </div>
        ))}
        <AddRow placeholder="New category" onAdd={actions.addCategory} />
      </nav>

      <div className="user">
        <span>{user.name}</span>
        <button className="link" onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}
