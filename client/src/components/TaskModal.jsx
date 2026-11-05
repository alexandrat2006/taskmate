import { useEffect, useRef, useState } from 'react';

const EMPTY = { title: '', description: '', deadline: '', priority: 'medium', status: 'todo', course_id: '', category_id: '' };

export default function TaskModal({ task, courses, categories, onSave, onClose }) {
  const [form, setForm] = useState(
    task ? { ...EMPTY, ...task, deadline: task.deadline || '', course_id: task.course_id || '', category_id: task.category_id || '', description: task.description || '' } : EMPTY
  );
  const [error, setError] = useState('');
  const first = useRef(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label={task ? 'Edit task' : 'New task'}>
        <h2>{task ? 'Edit task' : 'New task'}</h2>

        <label>Title<input ref={first} value={form.title} onChange={set('title')} required maxLength={200} /></label>
        <label>Notes<textarea rows={3} value={form.description} onChange={set('description')} /></label>

        <div className="grid2">
          <label>Deadline<input type="date" value={form.deadline} onChange={set('deadline')} /></label>
          <label>Priority
            <select value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>
          <label>Course
            <select value={form.course_id} onChange={set('course_id')}>
              <option value="">None</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Category
            <select value={form.category_id} onChange={set('category_id')}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>

        {task && (
          <label>Status
            <select value={form.status} onChange={set('status')}>
              <option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option>
            </select>
          </label>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary">{task ? 'Save changes' : 'Add task'}</button>
        </div>
      </form>
    </div>
  );
}
