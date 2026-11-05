import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = mode === 'login' ? await api.login(form) : await api.register(form);
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-intro">
        <h1>TaskMate</h1>
        <p>Every assignment, every deadline, one list. Sort by what is due first and stop finding out on the day.</p>
        <ul className="auth-demo" aria-hidden="true">
          <li><span className="mark late">2d overdue</span> Lab report – Databases</li>
          <li><span className="mark soon">Due tomorrow</span> Essay draft – English</li>
          <li><span className="mark later">In 12 days</span> Final project – Web Dev</li>
        </ul>
      </section>

      <form className="auth-form" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
        {mode === 'register' && (
          <label>Name<input value={form.name} onChange={set('name')} required autoComplete="name" /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set('email')} required autoComplete="email" /></label>
        <label>Password
          <input type="password" value={form.password} onChange={set('password')} required minLength={6}
                 autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </main>
  );
}
