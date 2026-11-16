import { useState } from 'react';

// Shows the real poster when the title matched the archive (posterUrl).
// Otherwise (or if the image fails to load) shows a colored card with the title on it;
// the color comes from the title, so the same title always gets the same color.
export default function Poster({ title, type, posterUrl }) {
  const [broken, setBroken] = useState(false);

  if (posterUrl && !broken) {
    return (
      <div className="poster has-image">
        <img src={posterUrl} alt={`${title} poster`} loading="lazy" onError={() => setBroken(true)} />
      </div>
    );
  }

  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  const style = {
    background: `linear-gradient(160deg, hsl(${hue} 55% 38%), hsl(${(hue + 40) % 360} 60% 18%))`,
  };
  return (
    <div className="poster" style={style} aria-hidden="true">
      <span className="poster-type">{type === 'show' ? 'TV' : 'FILM'}</span>
      <span className="poster-title">{title}</span>
    </div>
  );
}
