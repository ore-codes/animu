import { sql } from '@/lib/db';
import { env } from '@/lib/env';

export type LimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

/**
 * Fixed-window counter in Postgres. Good enough to stop casual abuse without adding Redis;
 * a determined attacker can still burst across a window edge, which the AI daily cap covers.
 */
export async function hit(bucket: string, limit: number, windowSec: number): Promise<LimitResult> {
  const db = sql();
  const [row] = await db<{ count: number; window_start: Date }[]>`
    insert into rate_counter (bucket, window_start, count)
    values (${bucket}, to_timestamp(floor(extract(epoch from now()) / ${windowSec}) * ${windowSec}), 1)
    on conflict (bucket, window_start) do update set count = rate_counter.count + 1
    returning count, window_start`;

  if (Math.random() < 0.01) {
    void db`delete from rate_counter where window_start < now() - interval '2 days'`.catch(() => {});
  }

  const resetAt = row.window_start.getTime() + windowSec * 1000;
  return {
    ok: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSec: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
  };
}

/** One unit of the daily AI allowance. False means the cap is reached and callers must use the no-AI path. */
export async function consumeAiBudget(): Promise<boolean> {
  const limit = env().AI_DAILY_CALL_LIMIT;
  if (limit <= 0) return false;
  const day = new Date().toISOString().slice(0, 10);
  return (await hit(`ai:${day}`, limit, 86_400)).ok;
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}
