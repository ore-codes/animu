import { describe, expect, it } from 'vitest';
import { chooseBest, detectKind } from '@/server/ingest/merge';
import type { RawEpisode } from '@/server/sources/types';

const long = 'A synopsis that is comfortably longer than the sixty character minimum for search.';
const ep = (order: number, synopsis = long, title = `Episode ${order}`): RawEpisode => ({ order, title, synopsis });

describe('chooseBest', () => {
  it('uses TVmaze on a tie because it covers the whole show', () => {
    const r = chooseBest([ep(1), ep(2)], [ep(1), ep(2)]);
    expect(r.source).toBe('tvmaze');
  });

  it('uses Kitsu when it has more usable synopses', () => {
    const r = chooseBest([ep(1, 'short'), ep(2, 'short'), ep(3)], [ep(1), ep(2), ep(3), ep(4)]);
    expect(r.source).toBe('kitsu');
    expect(r.episodes).toHaveLength(4);
  });

  it('drops episodes without a usable synopsis', () => {
    const r = chooseBest([ep(1), ep(2, 'too short')], null);
    expect(r.episodes.map((e) => e.order)).toEqual([1]);
  });

  it('works when Kitsu found no match', () => {
    expect(chooseBest([ep(1)], null).source).toBe('tvmaze');
  });

  it('keeps the source episode numbers, gaps included', () => {
    const r = chooseBest([ep(1), ep(2, 'too short'), ep(3)], null);
    expect(r.episodes.map((e) => e.order)).toEqual([1, 3]);
  });
});

describe('detectKind', () => {
  it('flags recap episodes by title', () => {
    expect(detectKind(ep(5, long, 'Recap: The Story So Far'))).toBe('recap');
    expect(detectKind(ep(5, long, 'Summary Episode 2'))).toBe('recap');
  });

  it('flags recap episodes by synopsis opening', () => {
    expect(detectKind(ep(5, 'Recap of the first arc, looking back at every fight so far.'))).toBe('recap');
  });

  it('does not flag ordinary episodes', () => {
    expect(detectKind(ep(5, long, 'The Digest of Doom'))).toBe('recap');
    expect(detectKind(ep(5, long, 'Gon and Killua'))).toBe('episode');
  });
});
