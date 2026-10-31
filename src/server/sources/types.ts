export type RawEpisode = {
  /** Position in the show's own count. Not yet the app-wide order. */
  order: number;
  title: string;
  synopsis: string;
};

export type SourceName = 'tvmaze' | 'kitsu';

export type ShowHit = {
  tvmazeId: number;
  title: string;
  year: number | null;
};
