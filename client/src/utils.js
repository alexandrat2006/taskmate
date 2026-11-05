const DAY = 86400000;

export function daysUntil(deadline) {
  if (!deadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = deadline.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - today) / DAY);
}

export function deadlineLabel(deadline, done) {
  const n = daysUntil(deadline);
  if (n === null) return { text: 'No deadline', tone: 'none' };
  const date = new Date(deadline + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (done) return { text: date, tone: 'done' };
  if (n < 0) return { text: `${-n}d overdue`, tone: 'late', date };
  if (n === 0) return { text: 'Due today', tone: 'soon', date };
  if (n === 1) return { text: 'Due tomorrow', tone: 'soon', date };
  if (n <= 7) return { text: `In ${n} days`, tone: 'soon', date };
  return { text: `In ${n} days`, tone: 'later', date };
}

export const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
export const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
