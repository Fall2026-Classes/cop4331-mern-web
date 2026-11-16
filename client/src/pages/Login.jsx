import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, saveLogin } from '../api.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered;
  const [login, setLogin] = useState(location.state?.login || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await api('/auth/login', { method: 'POST', body: { login: login.trim(), password } });
      saveLogin(user);
      navigate('/diary');
    } catch {
      // Any failure (wrong username, wrong password, server down) shows the same generic page.
      navigate('/login-failed');
    }
  }

  return (
    <main className="card narrow">
      <div className="brand big">Reel<span>Talk</span></div>
      <p className="tagline">Rate and review every movie and show you watch.</p>
      <h2>Log in</h2>
      {justRegistered && <p className="notice">Account created. You can log in now.</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="muted">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
