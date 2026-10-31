import { sql } from '@/lib/db';
import { z } from 'zod';
import { handle, json, limit } from '@/server/http';
import { searchShows } from '@/server/sources/tvmaze';

const querySchema = z.object({ q: z.string().trim().min(2).max(80) });

export const GET = handle(async (req) => {
  await limit(req, 'show-search', 60, 60);
  const { q } = querySchema.parse({ q: new URL(req.url).searchParams.get('q') ?? '' });

  const hits = (await searchShows(q)).slice(0, 8);
  const known = hits.length
    ? await sql()<{ tvmaze_id: number; status: string; episode_count: number }[]>`
        select tvmaze_id, status, episode_count from franchise where tvmaze_id in ${sql()(hits.map((h) => h.tvmazeId))}`
    : [];
  const byId = new Map(known.map((k) => [k.tvmaze_id, k]));

  return json({
    shows: hits.map((h) => ({
      tvmazeId: h.tvmazeId,
      title: h.title,
      englishTitle: h.englishTitle ?? null,
      year: h.year,
      status: byId.get(h.tvmazeId)?.status ?? 'missing',
      episodeCount: byId.get(h.tvmazeId)?.episode_count ?? null,
    })),
  });
});
