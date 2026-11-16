import { Link } from 'react-router-dom';

export default function LoginFailed() {
  return (
    <main className="card narrow">
      <div className="brand big">Reel<span>Talk</span></div>
      <h1>Login failed</h1>
      <p className="error">The username or password is incorrect, or the login could not be completed.</p>
      <p>
        <Link className="button" to="/">Try again</Link>
      </p>
      <p className="muted">
        Need an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
