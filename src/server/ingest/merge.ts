import type { RawEpisode, SourceName } from '../sources/types';

export const MIN_SYNOPSIS_CHARS = 60;

export type EpisodeKind = 'episode' | 'recap' | 'filler';

export type ChosenEpisode = RawEpisode & { kind: EpisodeKind };

export const isUsable = (e: RawEpisode) => e.synopsis.length >= MIN_SYNOPSIS_CHARS;

/**
 * Picks the source with more usable synopses. A tie goes to TVmaze because it covers the whole show.
 * Episodes without a usable synopsis are dropped: they cannot be searched or recapped.
 */
export function chooseBest(
  tvmaze: RawEpisode[],
  kitsu: RawEpisode[] | null,
): { source: SourceName; episodes: ChosenEpisode[] } {
  const tvUsable = tvmaze.filter(isUsable);
  const kitsuUsable = kitsu?.filter(isUsable) ?? [];
  const useKitsu = kitsuUsable.length > tvUsable.length;
  const chosen = useKitsu ? kitsuUsable : tvUsable;
  return {
    source: useKitsu ? 'kitsu' : 'tvmaze',
    episodes: chosen.map((e) => ({ ...e, kind: detectKind(e) })),
  };
}

/** Only recaps are detectable from the data we have. Filler needs a source we do not use yet. */
export function detectKind(e: RawEpisode): EpisodeKind {
  const title = e.title.toLowerCase();
  if (/\b(recap|summary|digest|highlights?)\b/.test(title)) return 'recap';
  if (/^(this is a )?recap\b/i.test(e.synopsis)) return 'recap';
  return 'episode';
}
