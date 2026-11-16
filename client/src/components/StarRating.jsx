import { useState } from 'react';

// Shows 0-5 stars in half-star steps.
// If onChange is given, the stars are clickable: left half of a star = half, right half = whole.
// Clicking the current rating again clears it. Arrow keys also work.
export default function StarRating({ value = 0, onChange, size = 22 }) {
  const [hover, setHover] = useState(null);
  const editable = typeof onChange === 'function';
  const shown = hover ?? value ?? 0;

  function valueAt(e, i) {
    const box = e.currentTarget.getBoundingClientRect();
    return e.clientX - box.left < box.width / 2 ? i + 0.5 : i + 1;
  }

  function handleKey(e) {
    if (!editable) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(5, (value || 0) + 0.5));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(0, (value || 0) - 0.5));
    else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '0') onChange(0);
    else return;
    e.preventDefault();
  }

  return (
    <span
      className={`stars${editable ? ' editable' : ''}`}
      style={{ fontSize: size }}
      role={editable ? 'slider' : 'img'}
      aria-label={value ? `${value} out of 5 stars` : 'No rating'}
      aria-valuemin={editable ? 0 : undefined}
      aria-valuemax={editable ? 5 : undefined}
      aria-valuenow={editable ? value || 0 : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={handleKey}
      onMouseLeave={() => setHover(null)}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, shown - i)); // 0, 0.5 or 1
        return (
          <span
            key={i}
            className="star"
            onMouseMove={editable ? (e) => setHover(valueAt(e, i)) : undefined}
            onClick={editable ? (e) => { const v = valueAt(e, i); onChange(v === value ? 0 : v); } : undefined}
          >
            <span className="star-bg">★</span>
            <span className="star-fill" style={{ width: `${fill * 100}%` }}>★</span>
          </span>
        );
      })}
    </span>
  );
}
