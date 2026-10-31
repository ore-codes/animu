import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL = 'postgres://unused';
process.env.APP_ORIGIN = 'https://animu.net';

const { assertSameOrigin, HttpError } = await import('@/server/http');

const post = (origin?: string) =>
  new Request('https://animu.net/api/find', { method: 'POST', headers: origin ? { origin } : {} });

describe('assertSameOrigin', () => {
  it('accepts the configured origin', () => {
    expect(() => assertSameOrigin(post('https://animu.net'))).not.toThrow();
  });

  it('rejects a foreign origin', () => {
    expect(() => assertSameOrigin(post('https://evil.example'))).toThrow(HttpError);
  });

  it('rejects a missing origin', () => {
    expect(() => assertSameOrigin(post())).toThrow(HttpError);
  });
});
