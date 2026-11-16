import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUser, logout } from '../api.js';
import StarRating from '../components/StarRating.jsx';
import Poster from '../components/Poster.jsx';
import TitleInput from '../components/TitleInput.jsx';
import { findPoster, loadCatalog } from '../catalog.js';

const EMPTY = { title: '', type: 'movie', year: '', rating: 0, review: '', watchedOn: '' };

const SORTS = {
  recent: { label: 'Recently added', fn: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  ratingHigh: { label: 'Highest rated', fn: (a, b) => (b.rating || 0) - (a.rating || 0) },
  ratingLow: { label: 'Lowest rated', fn: (a, b) => (a.rating || 99) - (b.rating || 99) },
  title: { label: 'Title A-Z', fn: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) },
  yearNew: { label: 'Release year (newest)', fn: (a, b) => (b.year || 0) - (a.year || 0) },
};

function formatDate(d) {
  if (!d) return '';
  // Dates are stored as midnight UTC; show them as that calendar day.
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// The API stores a diary entry as a review: { movieTitle, description, ... }.
// These two functions convert between that and the { title, review, ... } shape this page uses.
function toEntry(r) {
  const entry = {
    _id: r._id,
    title: r.movieTitle,
    type: r.type || 'movie',
    year: r.year ?? null,
    rating: r.rating || 0,
    review: r.description || '',
    watchedOn: r.watchedOn || null,
    createdAt: r.createdAt,
  };
  entry.posterUrl = findPoster(entry);
  return entry;
}

function toReviewBody(f) {
  return {
    movieTitle: f.title.trim(),
    type: f.type,
    year: f.year === '' || f.year === null ? null : Number(f.year),
    rating: Number(f.rating) || 0,
    description: f.review.trim(),
    watchedOn: f.watchedOn || null,
  };
}

export default function Diary() {
  const navigate = useNavigate();
  const user = getUser();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  // Shows an error, or sends the user back to login if their session ran out.
  function handleError(err) {
    if (err.status === 401) return handleLogout();
    setError(err.message);
  }

  useEffect(() => {
    Promise.all([api('/reviews'), loadCatalog().catch(() => null)])
      .then(([reviews]) => setEntries(reviews.map(toEntry)))
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => filter === 'all' || e.type === filter)
      .filter((e) => !q || e.title.toLowerCase().includes(q) || (e.review || '').toLowerCase().includes(q))
      .sort(SORTS[sort].fn);
  }, [entries, filter, search, sort]);

  const stats = useMemo(() => {
    const rated = entries.filter((e) => e.rating);
    return {
      total: entries.length,
      movies: entries.filter((e) => e.type === 'movie').length,
      shows: entries.filter((e) => e.type === 'show').length,
      avg: rated.length ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length).toFixed(1) : '-',
    };
  }, [entries]);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  }

  function startEdit(e) {
    setEditingId(e._id);
    setForm({
      title: e.title,
      type: e.type,
      year: e.year ?? '',
      rating: e.rating || 0,
      review: e.review || '',
      watchedOn: e.watchedOn ? e.watchedOn.slice(0, 10) : '',
    });
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        const review = await api(`/reviews/${editingId}`, { method: 'PATCH', body: toReviewBody(form) });
        const entry = toEntry(review);
        setEntries((list) => list.map((x) => (x._id === editingId ? entry : x)));
      } else {
        const review = await api('/reviews', { method: 'POST', body: toReviewBody(form) });
        setEntries((list) => [toEntry(review), ...list]);
      }
      closeForm();
    } catch (err) {
      handleError(err);
    }
  }

  async function handleDelete(e) {
    if (!window.confirm(`Remove "${e.title}" from your diary?`)) return;
    try {
      await api(`/reviews/${e._id}`, { method: 'DELETE' });
      setEntries((list) => list.filter((x) => x._id !== e._id));
      if (editingId === e._id) closeForm();
    } catch (err) {
      handleError(err);
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Reel<span>Talk</span></div>
        <div className="topbar-right">
          <span className="muted">{user ? ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.login) : ''}</span>
          <button className="ghost" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main className="wide">
        <section className="stats">
          <div><strong>{stats.total}</strong><span>Logged</span></div>
          <div><strong>{stats.movies}</strong><span>Movies</span></div>
          <div><strong>{stats.shows}</strong><span>Shows</span></div>
          <div><strong>{stats.avg}</strong><span>Avg rating</span></div>
        </section>

        {error && !showForm && <p className="error">{error}</p>}

        {showForm ? (
          <section className="panel">
            <h2>{editingId ? 'Edit entry' : 'Log a movie or show'}</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSave} className="entry-form">
              <div className="segmented" role="radiogroup" aria-label="Type">
                {['movie', 'show'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={form.type === t}
                    className={form.type === t ? 'active' : ''}
                    onClick={() => setForm({ ...form, type: t })}
                  >
                    {t === 'movie' ? 'Movie' : 'TV show'}
                  </button>
                ))}
              </div>
              <div className="row">
                <label className="grow">
                  Title
                  <TitleInput
                    value={form.title}
                    type={form.type}
                    onChange={(title) => setForm((f) => ({ ...f, title }))}
                    onPick={(r) => setForm((f) => ({ ...f, title: r.title, type: r.type, year: r.year ?? '' }))}
                  />
                </label>
                <label className="year">
                  Year
                  <input type="number" min="1870" max="2100" value={form.year} onChange={update('year')} placeholder="2001" />
                </label>
              </div>
              <div className="row">
                <label>
                  Your rating
                  <StarRating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} size={30} />
                  <span className="muted small">{form.rating ? `${form.rating} / 5` : 'Click a star (left half = ½)'}</span>
                </label>
                <label>
                  Watched on
                  <input type="date" value={form.watchedOn} onChange={update('watchedOn')} />
                </label>
              </div>
              <label>
                Review
                <textarea rows={3} value={form.review} onChange={update('review')} placeholder="What did you think?" maxLength={2000} required />
              </label>
              <div className="form-buttons">
                <button type="submit">{editingId ? 'Save changes' : 'Add to diary'}</button>
                <button type="button" className="ghost" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </section>
        ) : (
          <button className="add-button" onClick={openNew}>+ Log a movie or show</button>
        )}

        <section className="controls">
          <div className="tabs" role="tablist">
            {[['all', 'All'], ['movie', 'Movies'], ['show', 'Shows']].map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={filter === key}
                className={filter === key ? 'active' : ''}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <input className="search" placeholder="Search titles and reviews" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
            {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>
        </section>

        {loading ? (
          <p className="muted">Loading your diary...</p>
        ) : entries.length === 0 ? (
          <div className="empty">
            <p>Your diary is empty.</p>
            <p className="muted">Log the last thing you watched to get started.</p>
          </div>
        ) : shown.length === 0 ? (
          <p className="muted">Nothing matches that filter.</p>
        ) : (
          <ul className="grid">
            {shown.map((e) => (
              <li key={e._id} className={`entry${e._id === editingId ? ' editing' : ''}`}>
                <Poster title={e.title} type={e.type} posterUrl={e.posterUrl} />
                <div className="entry-body">
                  <h3>{e.title}</h3>
                  <p className="meta">
                    {e.year && <span>{e.year}</span>}
                    <span className={`badge ${e.type}`}>{e.type === 'show' ? 'TV' : 'Movie'}</span>
                  </p>
                  {e.rating ? <StarRating value={e.rating} size={18} /> : <span className="muted small">Not rated</span>}
                  {e.review && <p className="review">{e.review}</p>}
                  {e.watchedOn && <p className="muted small">Watched {formatDate(e.watchedOn)}</p>}
                  <div className="entry-actions">
                    <button className="ghost small" onClick={() => startEdit(e)}>Edit</button>
                    <button className="ghost danger small" onClick={() => handleDelete(e)}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <footer className="credit">
        Posters and title data from <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB</a>.
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}
