import type { AnimeSearchResponse } from "../../lib/types";

export interface SearchFilters {
  title: string;
  status: string;
  type: string;
  rating: string;
  order: string;
  score: string;
  genre: string;
  moodGenres?: string; // from mood chips
}

export async function fetchAnimeRecommendations(
  page: number,
  filters: SearchFilters
): Promise<AnimeSearchResponse> {
  const base = "https://api.jikan.moe/v4/anime";
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("limit", "20");
  params.set("sfw", "true");

  if (filters.title) params.set("q", filters.title);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.rating) params.set("rating", filters.rating);
  
  if (filters.order) {
    params.set("order_by", filters.order);
    params.set("sort", "desc");
  }

  if (filters.score) params.set("min_score", filters.score);

  if (filters.moodGenres) {
    params.set("genres", filters.moodGenres);
  } else if (filters.genre) {
    params.set("genres", filters.genre);
  }

  const res = await fetch(`${base}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
}
