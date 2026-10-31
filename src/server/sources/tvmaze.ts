import { stripHtml } from '../ingest/text';
import { getJson } from './http';
import type { RawEpisode, ShowHit } from './types';

const BASE = 'https://api.tvmaze.com';

type TvmazeShow = { id: number; name: string; premiered: string | null; language: string | null; type: string | null };
type TvmazeEpisode = { name: string; summary: string | null; type: string; airstamp: string | null; season: number; number: number | null };

const yearOf = (d: string | null) => (d ? Number(d.slice(0, 4)) : null);

const ENGLISH = new Set(['US', 'GB', 'CA', 'AU']);
const englishTitles = new Map<number, string | null>();

/** TVmaze keeps the English release title as an alternate name, so a search in English can show it. */
async function englishTitle(id: number, title: string): Promise<string | null> {
  if (!englishTitles.has(id)) {
    const show = await getJson<{ _embedded?: { akas: { name: string; country: { code: string } | null }[] } }>(
      `${BASE}/shows/${id}?embed=akas`,
    ).catch(() => null);
    if (!show) return null;
    englishTitles.set(id, show._embedded?.akas.find((a) => a.country && ENGLISH.has(a.country.code))?.name ?? null);
  }
  const name = englishTitles.get(id) ?? null;
  return name && name.toLowerCase() !== title.toLowerCase() ? name : null;
}

/** Anime only: TVmaze marks them Animation with a Japanese original language. */
export async function searchShows(query: string): Promise<ShowHit[]> {
  const hits = await getJson<{ show: TvmazeShow }[]>(`${BASE}/search/shows?q=${encodeURIComponent(query)}`);
  const anime = hits.filter(({ show }) => show.language === 'Japanese' && show.type === 'Animation');
  return Promise.all(
    anime.map(async ({ show }) => ({
      tvmazeId: show.id,
      title: show.name,
      englishTitle: await englishTitle(show.id, show.name),
      year: yearOf(show.premiered),
    })),
  );
}

/** Null when the id is not an anime, so the prepare endpoint cannot be used to ingest arbitrary shows. */
export async function getAnime(id: number): Promise<ShowHit | null> {
  const show = await getJson<TvmazeShow>(`${BASE}/shows/${id}`).catch(() => null);
  if (!show || show.language !== 'Japanese' || show.type !== 'Animation') return null;
  return { tvmazeId: show.id, title: show.name, year: yearOf(show.premiered) };
}

/** Regular episodes in airing order, numbered 1..n across all seasons. */
export async function getEpisodes(id: number): Promise<RawEpisode[]> {
  const eps = await getJson<TvmazeEpisode[]>(`${BASE}/shows/${id}/episodes`);
  return eps
    .filter((e) => e.type === 'regular')
    .sort((a, b) => (a.airstamp ?? '').localeCompare(b.airstamp ?? '') || a.season - b.season || (a.number ?? 0) - (b.number ?? 0))
    .map((e, i) => ({ order: i + 1, title: e.name, synopsis: stripHtml(e.summary) }));
}
