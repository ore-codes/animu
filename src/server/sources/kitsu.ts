import { stripHtml } from '../ingest/text';
import { getJson } from './http';
import type { RawEpisode } from './types';

const BASE = 'https://kitsu.io/api/edge';
const HEADERS = { Accept: 'application/vnd.api+json' };

type KitsuAnime = { id: string; attributes: { canonicalTitle: string; startDate: string | null; episodeCount: number | null } };
type KitsuEpisode = { attributes: { number: number | null; canonicalTitle: string | null; synopsis: string | null; description: string | null } };
type Page<T> = { data: T[]; links?: { next?: string } };

/**
 * Kitsu lists each season as its own entry, so a match is only trusted when it starts in
 * the show's premiere year and its episode count is within 5 percent of the TVmaze count.
 * That keeps Kitsu from replacing a whole-show list with a single season.
 */
export async function findMatch(title: string, year: number | null, expectedCount: number): Promise<string | null> {
  const page = await getJson<Page<KitsuAnime>>(
    `${BASE}/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=10`,
    HEADERS,
  );
  let best: { id: string; diff: number } | null = null;
  for (const { id, attributes: a } of page.data) {
    const count = a.episodeCount;
    if (!count || expectedCount <= 0) continue;
    const startYear = a.startDate ? Number(a.startDate.slice(0, 4)) : null;
    if (year && startYear && Math.abs(startYear - year) > 1) continue;
    const diff = Math.abs(count - expectedCount) / expectedCount;
    if (diff > 0.05) continue;
    if (!best || diff < best.diff) best = { id, diff };
  }
  return best?.id ?? null;
}

export async function getEpisodes(kitsuId: string): Promise<RawEpisode[]> {
  const out: RawEpisode[] = [];
  let url: string | undefined = `${BASE}/anime/${kitsuId}/episodes?page[limit]=20&sort=number`;
  while (url) {
    const page: Page<KitsuEpisode> = await getJson(url, HEADERS);
    for (const { attributes: a } of page.data) {
      if (!a.number) continue;
      out.push({ order: a.number, title: a.canonicalTitle ?? '', synopsis: stripHtml(a.synopsis ?? a.description) });
    }
    url = page.links?.next;
  }
  return out;
}
