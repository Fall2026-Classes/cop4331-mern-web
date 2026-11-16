import { useEffect, useRef, useState } from 'react';
import { searchCatalog } from '../catalog.js';

// Title box that suggests matching titles from the archive of top movies and shows.
// Picking one fills in the title, year and type. Typing your own title still works.
export default function TitleInput({ value, type, onChange, onPick }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNext = useRef(false);

  // Look up suggestions shortly after the user stops typing.
  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return; }
    const q = value.trim();
    if (q.length < 2) { setResults([]); return; }
    const timer = setTimeout(() => {
      searchCatalog(q)
        .then((found) => { setResults(found); setActive(-1); })
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  // Same type first, so "Movie" mode shows movies on top.
  const sorted = [...results].sort((a, b) => (a.type === type ? 0 : 1) - (b.type === type ? 0 : 1));

  function pick(r) {
    skipNext.current = true;
    onPick(r);
    setOpen(false);
    setResults([]);
  }

  function handleKey(e) {
    if (!open || !sorted.length) return;
    if (e.key === 'ArrowDown') { setActive((i) => Math.min(sorted.length - 1, i + 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActive((i) => Math.max(-1, i - 1)); e.preventDefault(); }
    else if (e.key === 'Enter' && active >= 0) { pick(sorted[active]); e.preventDefault(); }
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div className="title-input">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKey}
        placeholder="Start typing, e.g. Spirited Away"
        autoComplete="off"
        required
        autoFocus
        role="combobox"
        aria-expanded={open && sorted.length > 0}
        aria-autocomplete="list"
      />
      {open && sorted.length > 0 && (
        <ul className="suggestions" role="listbox">
          {sorted.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseDown={(e) => { e.preventDefault(); pick(r); }}
              onMouseEnter={() => setActive(i)}
            >
              {r.posterUrl ? <img src={r.posterUrl} alt="" /> : <span className="thumb-blank" />}
              <span className="s-title">{r.title}</span>
              <span className="s-meta">
                {r.year || ''} · {r.type === 'show' ? 'TV' : 'Movie'} · #{r.rank}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
