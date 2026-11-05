// Small fetch wrapper: adds the JWT, parses JSON, throws readable errors.
const TOKEN_KEY = 'taskmate_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = 'GET', body, params } = {}) {
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    : '';
  const res = await fetch(`/api${path}${query}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),

  tasks: (params) => request('/tasks', { params }),
  stats: () => request('/tasks/stats'),
  createTask: (b) => request('/tasks', { method: 'POST', body: b }),
  updateTask: (id, b) => request(`/tasks/${id}`, { method: 'PUT', body: b }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  courses: () => request('/courses'),
  createCourse: (b) => request('/courses', { method: 'POST', body: b }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),

  categories: () => request('/categories'),
  createCategory: (b) => request('/categories', { method: 'POST', body: b }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};
