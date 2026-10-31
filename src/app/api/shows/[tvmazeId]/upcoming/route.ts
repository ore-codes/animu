import { z } from 'zod';
import { sql } from '@/lib/db';
import { parseId, requireReady } from '@/server/franchise';
import { handle, json, limit } from '@/server/http';

type Ctx = { params: Promise<{ tvmazeId: string }> };

const query = z.object({
  after: z.coerce.number().int().min(0).max(100_000),
  reveal: z.enum(['0', '1']).default('0'),
});

/** The next five episodes. Titles only when the viewer explicitly asks, and never synopses. */
export const GET = handle<Ctx>(async (req, { params }) => {
  await limit(req, 'upcoming', 60, 60);
  const sp = new URL(req.url).searchParams;
  const { after, reveal } = query.parse({ after: sp.get('after'), reveal: sp.get('reveal') ?? undefined });
  const franchise = await requireReady(parseId((await params).tvmazeId));

  const rows = await sql()<{ order: number; kind: string; title: string }[]>`
    select global_order as "order", kind, title from episode
    where franchise_id = ${franchise.id} and global_order > ${after}
    order by global_order limit 5`;

  return json({
    upcoming: rows.map((r) => (reveal === '1' ? r : { order: r.order, kind: r.kind })),
  });
});
