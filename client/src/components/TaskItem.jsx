import { deadlineLabel, STATUS_LABEL, NEXT_STATUS } from '../utils.js';

export default function TaskItem({ task, onStatus, onEdit, onDelete }) {
  const done = task.status === 'done';
  const dl = deadlineLabel(task.deadline, done);

  return (
    <li className={`task ${done ? 'is-done' : ''}`}>
      <button className={`check ${task.status}`} onClick={() => onStatus(task, done ? 'todo' : 'done')}
              aria-label={done ? 'Mark as not done' : 'Mark as done'} title={done ? 'Mark as not done' : 'Mark as done'}>
        {done ? '✓' : ''}
      </button>

      <div className="task-body">
        <h4>{task.title}</h4>
        <p className="meta">
          {task.course_name && (
            <span className="course"><i style={{ background: task.course_color }} />{task.course_name}</span>
          )}
          {task.category_name && <span>{task.category_name}</span>}
          <span className={`prio ${task.priority}`}>{task.priority} priority</span>
        </p>
        {task.description && <p className="desc">{task.description}</p>}
      </div>

      <div className="task-side">
        <span className={`mark ${dl.tone}`} title={dl.date}>{dl.text}</span>
        <button className="status-btn" onClick={() => onStatus(task, NEXT_STATUS[task.status])}
                title="Move to next status">
          {STATUS_LABEL[task.status]}
        </button>
        <div className="row-actions">
          <button className="link" onClick={() => onEdit(task)}>Edit</button>
          <button className="link danger" onClick={() => onDelete(task)}>Delete</button>
        </div>
      </div>
    </li>
  );
}
