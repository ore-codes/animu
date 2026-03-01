import type { Episode } from "../arcSearch/types";

export interface EpisodeSentiment {
  episodeNumber: number;
  score: number;
  reasoning: string;
}

export interface SentimentAnalysisResponse {
  summary: string;
  episodes: EpisodeSentiment[];
}

export async function analyzeSynopses(animeId: number, episodes: Episode[]): Promise<SentimentAnalysisResponse> {
  if (episodes.length === 0) throw new Error("No episodes provided for analysis.");

  const cacheKey = `animu_sentiment_anime_${animeId}`;
  const cachedResult = localStorage.getItem(cacheKey);

  if (cachedResult) {
    try {
      const parsedCache = JSON.parse(cachedResult) as SentimentAnalysisResponse;
      if (parsedCache && parsedCache.summary && Array.isArray(parsedCache.episodes)) {
        return parsedCache; // Return cached response immediately
      }
    } catch (e) {
      console.warn("Invalid sentiment cache, re-fetching...", e);
    }
  }

  try {
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev ? "http://localhost:3000" : ""; // Assuming Vercel Dev runs on 3000

    const response = await fetch(`${baseUrl}/api/sentiment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ episodes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch sentiment analysis from server.");
    }

    const formattedResponse: SentimentAnalysisResponse = await response.json();

    // Save strictly to local storage
    try {
      localStorage.setItem(cacheKey, JSON.stringify(formattedResponse));
    } catch (cacheError) {
      console.warn("Failed to cache sentiment map. Storage might be full.", cacheError);
    }

    return formattedResponse;
  } catch (error) {
    console.error("Failed to analyze sentiment:", error);
    throw new Error("Analysis failed. Try again later.");
  }
}
