import { sql, toVector } from '@/lib/db';
import { getEmbedder } from '../embeddings';
import * as kitsu from '../sources/kitsu';
import * as tvmaze from '../sources/tvmaze';
import type { ShowHit } from '../sources/types';
import { chooseBest } from './merge';

const STALE_MINUTES = 15;

/** Stored as the run error; the status route turns it into a code the interface can explain. */
export const NO_SYNOPSES = 'No episode has a usable synopsis in any source';

export type FranchiseRow = {
  id: number;
  tvmaze_id: number;
  title: string;
  year: number | null;
  status: 'missing' | 'preparing' | 'ready' | 'failed';
  episode_count: number;
};

export async function upsertFranchise(show: ShowHit): Promise<FranchiseRow> {
  const [row] = await sql()<FranchiseRow[]>`
    insert into franchise (tvmaze_id, title, year)
    values (${show.tvmazeId}, ${show.title}, ${show.year})
    on conflict (tvmaze_id) do update set title = excluded.title, year = excluded.year
    returning id, tvmaze_id, title, year, status, episode_count`;
  return row;
}

/**
 * Takes the ingest lock. Returns false when another run is active, unless that run is stale
 * (a crashed serverless function never clears its own flag).
 */
export async function claimIngest(franchiseId: number): Promise<boolean> {
  const rows = await sql()`
    update franchise set status = 'preparing', updated_at = now()
    where id = ${franchiseId}
      and (status <> 'preparing' or updated_at < now() - make_interval(mins => ${STALE_MINUTES}))
    returning id`;
  return rows.length > 0;
}

/** Call only after claimIngest returned true. */
export async function ingestFranchise(franchiseId: number): Promise<void> {
  const db = sql();
  const [f] = await db<FranchiseRow[]>`select id, tvmaze_id, title, year, status, episode_count from franchise where id = ${franchiseId}`;
  const [run] = await db<{ id: number }[]>`insert into ingest_run (franchise_id, status, step) values (${franchiseId}, 'running', 'sources') returning id`;
  const progress = (step: string, pct: number) =>
    db`update ingest_run set step = ${step}, progress = ${pct} where id = ${run.id}`;

  try {
    const tv = await tvmaze.getEpisodes(f.tvmaze_id);

    let kitsuEpisodes = null;
    let kitsuId: string | null = null;
    try {
      kitsuId = await kitsu.findMatch(f.title, f.year, tv.length);
      if (kitsuId) kitsuEpisodes = await kitsu.getEpisodes(kitsuId);
    } catch {
      // Kitsu is a bonus source. TVmaze alone is enough to continue.
    }

    const { source, episodes } = chooseBest(tv, kitsuEpisodes);
    if (episodes.length === 0) throw new Error(NO_SYNOPSES);

    await progress('embedding', 20);
    const embedder = await getEmbedder();
    const texts = episodes.map((e) => `${e.title}. ${e.synopsis}`);
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += 64) {
      vectors.push(...(await embedder.embedDocuments(texts.slice(i, i + 64))));
      await progress('embedding', 20 + Math.round(((i + 64) / texts.length) * 70));
    }

    await progress('saving', 95);
    await db.begin(async (tx) => {
      await tx`delete from episode where franchise_id = ${franchiseId}`;
      for (let i = 0; i < episodes.length; i += 200) {
        const rows = episodes.slice(i, i + 200).map((e, j) => ({
          franchise_id: franchiseId,
          global_order: e.order,
          title: e.title,
          synopsis: e.synopsis,
          kind: e.kind,
          embedding: toVector(vectors[i + j]),
          embedding_model: embedder.id,
        }));
        await tx`insert into episode ${tx(rows)}`;
      }
      await tx`
        update franchise set status = 'ready', episode_count = ${episodes.length}, synopsis_source = ${source},
          kitsu_id = ${kitsuId}, updated_at = now()
        where id = ${franchiseId}`;
    });
    await db`update ingest_run set status = 'done', step = 'done', progress = 100, finished_at = now() where id = ${run.id}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db`update ingest_run set status = 'failed', error = ${message}, finished_at = now() where id = ${run.id}`;
    // Keep serving the old data if this was a refresh.
    await db`update franchise set status = ${f.episode_count > 0 ? 'ready' : 'failed'}, updated_at = now() where id = ${franchiseId}`;
    throw err;
  }
}
