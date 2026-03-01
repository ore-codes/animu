export interface Episode {
  mal_id: number;
  title: string;
  title_japanese?: string;
  title_romanji?: string;
  synopsis?: string;
}

export interface EpisodesResponse {
  data: Episode[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}
