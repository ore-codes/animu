import { z } from 'zod';
import { requireReady } from '@/server/franchise';
import { assertSameOrigin, handle, json, limit } from '@/server/http';
import { findEpisodes } from '@/server/search/find';

const body = z.object({
  tvmazeId: z.number().int().positive(),
  query: z.string().trim().min(3).max(300),
});

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  await limit(req, 'find', 20, 60);
  const { tvmazeId, query } = body.parse(await req.json().catch(() => ({})));
  const franchise = await requireReady(tvmazeId);
  return json(await findEpisodes(franchise.id, query, franchise.title));
});
