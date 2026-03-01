export interface AnimeItem {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  title_romanji?: string;
  images?: {
    jpg?: {
      image_url?: string;
    };
  };
  status?: string;
  type?: string;
  episodes?: number;
  score?: number;
  synopsis?: string;
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface AnimeSearchResponse {
  data: AnimeItem[];
  pagination: JikanPagination;
}

export interface EpisodesSearchResponse {
  data: AnimeItem[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}
