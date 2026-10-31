import { env } from '@/lib/env';
import { ZodError } from 'zod';
import { clientIp, hit } from './limits';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(data, { status, headers });

/** Browsers always send Origin on cross-site POSTs, so a missing or foreign Origin is rejected. */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const allowed = env().APP_ORIGIN ?? `${new URL(req.url).protocol}//${req.headers.get('host')}`;
  if (origin !== allowed) throw new HttpError(403, 'Requests must come from the Animu site.');
}

export async function limit(req: Request, name: string, max: number, windowSec: number) {
  const res = await hit(`${name}:${clientIp(req)}`, max, windowSec);
  if (!res.ok) {
    throw new HttpError(429, 'Too many requests. Try again shortly.', { 'retry-after': String(res.retryAfterSec) });
  }
}

export function handle<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status, err.headers);
      if (err instanceof ZodError) return json({ error: 'Invalid request.', issues: err.issues.map((i) => i.message) }, 400);
      console.error(err);
      return json({ error: 'Something went wrong on our side.' }, 500);
    }
  };
}
