import { after } from 'next/server';
import { parseId } from '@/server/franchise';
import { assertSameOrigin, handle, HttpError, json, limit } from '@/server/http';
import { claimIngest, ingestFranchise, upsertFranchise } from '@/server/ingest/run';
import { getAnime } from '@/server/sources/tvmaze';

export const maxDuration = 300;

type Ctx = { params: Promise<{ tvmazeId: string }> };

/** Starts reading a show's episodes. Returns at once; poll GET /api/shows/:id for progress. */
export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  await limit(req, 'prepare', 6, 3600);

  const show = await getAnime(parseId((await params).tvmazeId));
  if (!show) throw new HttpError(404, 'That is not an anime we can prepare.');

  const franchise = await upsertFranchise(show);
  if (franchise.status === 'ready') return json({ status: 'ready' });

  if (!(await claimIngest(franchise.id))) return json({ status: 'preparing' }, 202);

  after(async () => {
    try {
      await ingestFranchise(franchise.id);
    } catch (err) {
      console.error(`ingest failed for ${franchise.title}`, err);
    }
  });
  return json({ status: 'preparing' }, 202);
});
