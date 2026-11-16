const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

export function normalizeTitle(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(the|a|an) /, '');
}

function posterUrl(posterPath) {
  return posterPath ? `${POSTER_BASE}${posterPath}` : null;
}

let titles = null;
let loading = null;

export function loadCatalog() {
  if (titles) return Promise.resolve(titles);
  if (!loading) {
    loading = fetch('/catalog.json')
      .then((res) => {
        if (!res.ok) throw new Error('Catalog not available');
        return res.json();
      })
      .then((data) => {
        titles = (data.titles || []).map((t) => ({
          ...t,
          keys: [...new Set([normalizeTitle(t.title), normalizeTitle(t.originalTitle)].filter(Boolean))],
        }));
        return titles;
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
  }
  return loading;
}

export async function searchCatalog(q, limit = 8) {
  const key = normalizeTitle(q);
  if (!key) return [];
  const all = await loadCatalog();
  return all
    .filter((t) => t.keys.some((k) => k.includes(key)))
    .sort((a, b) => {
      const aStarts = a.keys.some((k) => k.startsWith(key)) ? 0 : 1;
      const bStarts = b.keys.some((k) => k.startsWith(key)) ? 0 : 1;
      return aStarts - bStarts || a.rank - b.rank;
    })
    .slice(0, limit)
    .map((t) => ({
      id: `${t.type}-${t.tmdbId}`,
      title: t.title,
      type: t.type,
      year: t.year,
      rank: t.rank,
      posterUrl: posterUrl(t.posterPath),
    }));
}

export function findPoster({ title, type, year }) {
  if (!titles) return null;
  const key = normalizeTitle(title);
  if (!key || !type) return null;
  const candidates = titles.filter((t) => t.type === type && t.keys.includes(key)).sort((a, b) => a.rank - b.rank);
  if (!candidates.length) return null;
  const match = candidates.find((c) => year && c.year === Number(year)) || candidates[0];
  return posterUrl(match.posterPath);
}
