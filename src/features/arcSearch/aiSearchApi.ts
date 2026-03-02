import type { Episode } from "./types";

export interface AiSearchResponse {
  matchedEpisodes: number[];
  explanation: string;
}

export async function askAiForArc(
  animeTitle: string,
  query: string,
  episodes: Episode[]
): Promise<AiSearchResponse> {
  if (episodes.length === 0) throw new Error("No episodes provided for analysis.");

  const cacheKey = `animu_aisearch_${animeTitle}_${query}`;
  const cachedResult = localStorage.getItem(cacheKey);

  if (cachedResult) {
    try {
      const parsedCache = JSON.parse(cachedResult) as AiSearchResponse;
      if (parsedCache && parsedCache.explanation && Array.isArray(parsedCache.matchedEpisodes)) {
        return parsedCache; // Return cached response immediately
      }
    } catch (e) {
      console.warn("Invalid AI search cache, re-fetching...", e);
    }
  }

  try {
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev ? "http://localhost:3000" : "";

    const response = await fetch(`${baseUrl}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ animeTitle, query, episodes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch AI search from server.");
    }

    const formattedResponse: AiSearchResponse = await response.json();

    try {
      localStorage.setItem(cacheKey, JSON.stringify(formattedResponse));
    } catch (cacheError) {
      console.warn("Failed to cache AI search. Storage might be full.", cacheError);
    }

    return formattedResponse;
  } catch (error) {
    console.error("Failed to perform AI arc search:", error);
    throw new Error("AI search failed. Please try again.");
  }
}
