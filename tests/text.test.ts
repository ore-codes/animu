import { describe, expect, it } from 'vitest';
import { firstSentences, stripHtml } from '@/server/ingest/text';

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Gon  and <b>Killua</b></p>\n<p>meet.</p>')).toBe('Gon and Killua meet.');
  });

  it('decodes the entities TVmaze emits', () => {
    expect(stripHtml('Tom &amp; Jerry said &quot;hi&quot;')).toBe('Tom & Jerry said "hi"');
  });

  it('handles null', () => {
    expect(stripHtml(null)).toBe('');
  });
});

describe('firstSentences', () => {
  it('returns the first n sentences', () => {
    expect(firstSentences('One. Two! Three? Four.', 2)).toBe('One. Two!');
  });

  it('returns the whole text when there is no sentence end', () => {
    expect(firstSentences('no punctuation here', 3)).toBe('no punctuation here');
  });
});
