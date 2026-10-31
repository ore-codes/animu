import { sql } from '@/lib/db';
import { HttpError } from './http';
import type { FranchiseRow } from './ingest/run';

export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid show id.');
  return id;
}

export async function getFranchise(tvmazeId: number): Promise<FranchiseRow | null> {
  const [row] = await sql()<FranchiseRow[]>`
    select id, tvmaze_id, title, year, status, episode_count from franchise where tvmaze_id = ${tvmazeId}`;
  return row ?? null;
}

export async function requireReady(tvmazeId: number): Promise<FranchiseRow> {
  const f = await getFranchise(tvmazeId);
  if (!f) throw new HttpError(404, 'We have not prepared this show yet.');
  if (f.status !== 'ready') throw new HttpError(409, 'This show is not ready yet.');
  return f;
}
