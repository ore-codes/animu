import { createHash } from 'node:crypto';
import { sql, toVector } from '@/lib/db';
import { aiEnabled } from '@/lib/env';
import { getEmbedder } from '../embeddings';
import { consumeAiBudget } from '../limits';
import { rerank } from './rerank';

export const CANDIDATES = 15;
export const RESULTS = 3;

export type Candidate = { order: number; title: string; synopsis: string; kind: string; score: number };

/**
 * `confidence` is only set when the AI re-rank ran and is the model's own judgement.
 * The raw similarity score does not predict correctness (see `npm run calibrate`), so basic mode reports none.
 */
export type Confidence = 'high' | 'medium' | 'low';

export type Match = Candidate & { confidence?: Confidence; reason?: string };

export type FindResult = {
  mode: 'ai' | 'basic';
  matches: Match[];
  /** The next episodes after the best match: number and kind only, never titles or synopses. */
  upcoming: { order: number; kind: string }[];
};

const normalise = (q: string) => q.trim().replace(/\s+/g, ' ').toLowerCase();

export async function findEpisodes(franchiseId: number, query: string, title: string): Promise<FindResult> {
  const db = sql();
  const embedder = await getEmbedder();
  const wantAi = aiEnabled();
  const cacheMode = wantAi ? 'ai' : 'basic';
  const hash = createHash('sha256').update(`${embedder.id}|${normalise(query)}`).digest('hex');

  const [cached] = await db<{ result: FindResult }[]>`
    select result from query_cache where franchise_id = ${franchiseId} and query_hash = ${hash} and mode = ${cacheMode}`;
  if (cached) return cached.result;

  const qvec = toVector(await embedder.embedQuery(query));
  const candidates = await db<Candidate[]>`
    select global_order as "order", title, synopsis, kind, 1 - (embedding <=> ${qvec}::vector) as score
    from episode
    where franchise_id = ${franchiseId} and embedding_model = ${embedder.id}
    order by embedding <=> ${qvec}::vector
    limit ${CANDIDATES}`;

  if (candidates.length === 0) throw new Error('This show has no searchable episodes for the current embedding model. Re-run ingest.');

  let ordered: Match[] = candidates.slice(0, RESULTS);
  let mode: FindResult['mode'] = 'basic';

  if (wantAi && (await consumeAiBudget())) {
    try {
      const ranked = await rerank(title, query, candidates);
      if (ranked.length > 0) {
        const byOrder = new Map(candidates.map((c) => [c.order, c]));
        ordered = ranked.slice(0, RESULTS).map((r) => {
          const c = byOrder.get(r.order)!;
          return { ...c, confidence: r.confidence, reason: r.reason };
        });
        mode = 'ai';
      }
    } catch (err) {
      console.error('rerank failed, using meaning search only', err);
    }
  }

  const best = ordered[0];
  const upcoming = await db<{ order: number; kind: string }[]>`
    select global_order as "order", kind from episode
    where franchise_id = ${franchiseId} and global_order > ${best.order}
    order by global_order limit 5`;

  const result: FindResult = { mode, matches: ordered, upcoming };
  // Only cache what the cache key promises: a basic result must not be stored under the ai key.
  if (mode === cacheMode) {
    await db`
      insert into query_cache (franchise_id, query_hash, mode, result)
      values (${franchiseId}, ${hash}, ${mode}, ${db.json(result as never)})
      on conflict (franchise_id, query_hash, mode) do nothing`;
  }
  return result;
}
