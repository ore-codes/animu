import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/ai', () => ({ generateJson: vi.fn() }));
vi.mock('../src/server/ai', () => ({ generateJson: vi.fn() }));

import { generateJson } from '../src/server/ai';
import { rerank } from '../src/server/search/rerank';

const candidates = [10, 11, 12].map((order) => ({ order, title: `T${order}`, synopsis: 's', kind: 'episode', score: 0.7 }));

describe('rerank', () => {
  beforeEach(() => vi.mocked(generateJson).mockReset());

  it('keeps only real candidates, once each, in model order', async () => {
    vi.mocked(generateJson).mockResolvedValue({
      ranked: [
        { order: 11, confidence: 'high', reason: 'fits' },
        { order: 999, confidence: 'high', reason: 'invented episode' },
        { order: 11, confidence: 'low', reason: 'duplicate' },
        { order: 10, confidence: 'medium', reason: 'also fits' },
      ],
    });
    const out = await rerank('Show', 'query', candidates);
    expect(out.map((r) => r.order)).toEqual([11, 10]);
  });

  it('downgrades an unknown confidence value to low', async () => {
    vi.mocked(generateJson).mockResolvedValue({ ranked: [{ order: 10, confidence: 'certain', reason: 'x' }] });
    expect((await rerank('Show', 'q', candidates))[0].confidence).toBe('low');
  });

  it('truncates long reasons', async () => {
    vi.mocked(generateJson).mockResolvedValue({ ranked: [{ order: 10, confidence: 'high', reason: 'x'.repeat(1000) }] });
    expect((await rerank('Show', 'q', candidates))[0].reason).toHaveLength(240);
  });

  it('returns nothing when the model returns nothing', async () => {
    vi.mocked(generateJson).mockResolvedValue({} as never);
    expect(await rerank('Show', 'q', candidates)).toEqual([]);
  });
});
