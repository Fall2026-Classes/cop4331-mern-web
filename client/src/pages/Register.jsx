import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', login: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { firstName, lastName, login, password } = form;
      await api('/register', { method: 'POST', body: { firstName, lastName, login, password } });
      navigate('/', { state: { registered: true, login: login.trim().toLowerCase() } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="card narrow">
      <div className="brand big">Reel<span>Talk</span></div>
      <p className="tagline">Rate and review every movie and show you watch.</p>
      <h2>Create an account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <label>
            First name
            <input value={form.firstName} onChange={update('firstName')} autoComplete="given-name" required />
          </label>
          <label>
            Last name
            <input value={form.lastName} onChange={update('lastName')} autoComplete="family-name" required />
          </label>
        </div>
        <label>
          Username
          <input value={form.login} onChange={update('login')} autoComplete="username" required />
        </label>
        <label>
          Password (6+ characters)
          <input type="password" value={form.password} onChange={update('password')} autoComplete="new-password" minLength={6} required />
        </label>
        <label>
          Confirm password
          <input type="password" value={form.confirm} onChange={update('confirm')} autoComplete="new-password" required />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Creating...' : 'Register'}</button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/">Log in</Link>
      </p>
    </main>
  );
}
