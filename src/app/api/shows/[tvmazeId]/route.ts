import { sql } from '@/lib/db';
import { getFranchise, parseId } from '@/server/franchise';
import { handle, HttpError, json, limit } from '@/server/http';
import { NO_SYNOPSES } from '@/server/ingest/run';

type Ctx = { params: Promise<{ tvmazeId: string }> };

/** Status of a show: used to poll while it is being prepared. */
export const GET = handle<Ctx>(async (req, { params }) => {
  await limit(req, 'show-status', 120, 60);
  const f = await getFranchise(parseId((await params).tvmazeId));
  if (!f) throw new HttpError(404, 'Unknown show.');

  const [run] = await sql()<{ status: string; step: string; progress: number; error: string | null }[]>`
    select status, step, progress, error from ingest_run where franchise_id = ${f.id} order by started_at desc limit 1`;

  return json({
    tvmazeId: f.tvmaze_id,
    title: f.title,
    year: f.year,
    status: f.status,
    episodeCount: f.episode_count,
    // The raw error stays in the database and logs; the interface only gets a reason code.
    progress: run
      ? {
          step: run.step,
          percent: run.progress,
          failed: run.status === 'failed',
          reason: run.status === 'failed' ? (run.error === NO_SYNOPSES ? 'no_synopses' : 'error') : null,
        }
      : null,
  });
});
