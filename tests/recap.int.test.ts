// Needs the local database with a show ingested: DATABASE_URL=... npx vitest run tests/recap.int.test.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe.skipIf(!process.env.DATABASE_URL)('recapsBefore (database)', () => {
  let franchiseId = 0;
  let recapsBefore: typeof import('@/server/recap').recapsBefore;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const { sql } = await import('@/lib/db');
    ({ recapsBefore } = await import('@/server/recap'));
    const [f] = await sql()<{ id: number }[]>`select id from franchise where status = 'ready' order by id limit 1`;
    franchiseId = f.id;
    close = () => sql().end();
  });

  afterAll(() => close?.());

  it('never returns the target episode or later ones', async () => {
    const recaps = await recapsBefore(franchiseId, 63, 3);
    expect(recaps.map((r) => r.order)).toEqual([60, 61, 62]);
  });

  it('returns fewer near the start of the show', async () => {
    expect((await recapsBefore(franchiseId, 2, 3)).map((r) => r.order)).toEqual([1]);
  });

  it('returns nothing for the first episode', async () => {
    expect(await recapsBefore(franchiseId, 1, 3)).toEqual([]);
  });
});
