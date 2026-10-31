import { sql } from '@/lib/db';
import { parseId, requireReady } from '@/server/franchise';
import { handle, json, limit } from '@/server/http';

type Ctx = { params: Promise<{ tvmazeId: string }> };

/** The shape of a show: how many episodes, and where the recaps and fillers are. No titles or synopses. */
export const GET = handle<Ctx>(async (req, { params }) => {
  await limit(req, 'map', 60, 60);
  const franchise = await requireReady(parseId((await params).tvmazeId));

  const [{ total }] = await sql()<{ total: number }[]>`
    select coalesce(max(global_order), 0)::int as total from episode where franchise_id = ${franchise.id}`;
  const marks = await sql()<{ order: number; kind: string }[]>`
    select global_order as "order", kind from episode
    where franchise_id = ${franchise.id} and kind <> 'episode'
    order by global_order`;

  return json({ total, marks });
});
