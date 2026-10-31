import { z } from 'zod';
import { parseId, requireReady } from '@/server/franchise';
import { handle, json, limit } from '@/server/http';
import { recapsBefore } from '@/server/recap';

type Ctx = { params: Promise<{ tvmazeId: string }> };

const query = z.object({
  upTo: z.coerce.number().int().min(1).max(100_000),
  count: z.coerce.number().int().min(1).max(5).default(3),
});

/** "Previously on" for the episodes just before `upTo`. Never includes `upTo` or anything later. */
export const GET = handle<Ctx>(async (req, { params }) => {
  await limit(req, 'recap', 30, 60);
  const sp = new URL(req.url).searchParams;
  const { upTo, count } = query.parse({ upTo: sp.get('upTo'), count: sp.get('count') ?? undefined });
  const franchise = await requireReady(parseId((await params).tvmazeId));
  return json({ recaps: await recapsBefore(franchise.id, upTo, count) });
});
