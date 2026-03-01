import type { AnimeSearchResponse } from "../../lib/types";
import type { Episode, EpisodesResponse } from "./types";

export async function searchAnimeForArc(query: string): Promise<AnimeSearchResponse> {
  if (!query) return { data: [], pagination: { last_visible_page: 1, has_next_page: false, items: { count: 0, total: 0, per_page: 0 } } };
  
  const res = await fetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchAllEpisodes(animeId: number): Promise<Episode[]> {
  let episodes: Episode[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime/${animeId}/episodes?page=${page}`
    );
    if (!res.ok) {
      if (res.status === 429) {
        // Retry once after a longer delay if rate limited
        await sleep(2000);
        continue;
      }
      break;
    }
    
    const data: EpisodesResponse = await res.json();
    if (!data.data?.length) break;
    
    episodes = episodes.concat(data.data);
    hasNext = data.pagination?.has_next_page;
    page++;
    
    if (page > 20) break; // Safety cap — 2000 episodes max
    if (hasNext) await sleep(400); // Respect rate limit
  }
  
  return episodes;
}

export async function fetchKitsuEpisodes(malId: number): Promise<Record<number, string>> {
  try {
    // 1. Search Kitsu for the anime via MAL mapping
    const mappingRes = await fetch(
      `https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}`
    );
    if (!mappingRes.ok) return {};
    const mappingData = await mappingRes.json();
    
    if (!mappingData.data || mappingData.data.length === 0) return {};
    
    // 2. We need the actual Kitsu Anime ID from the mapping relationship
    const mappingId = mappingData.data[0].id;
    const itemRes = await fetch(`https://kitsu.io/api/edge/mappings/${mappingId}/item`);
    if (!itemRes.ok) return {};
    const itemData = await itemRes.json();
    
    if (!itemData.data || !itemData.data.id) return {};
    const kitsuId = itemData.data.id;
    
    // 3. Fetch episodes for this Kitsu ID
    let episodesList: Record<string, any>[] = [];
    let nextUrl = `https://kitsu.io/api/edge/anime/${kitsuId}/episodes?page[limit]=20`;

    while (nextUrl) {
      const epRes = await fetch(nextUrl);
      if (!epRes.ok) break;
      const epData = await epRes.json();
      
      if (!epData.data || epData.data.length === 0) break;
      
      episodesList = episodesList.concat(epData.data);
      
      nextUrl = epData.links?.next || null;
      if (nextUrl) await sleep(200); // Respect Kitsu rate limits
    }

    // 3. Map to a dictionary: episode number -> synopsis
    const synopsisMap: Record<number, string> = {};
    episodesList.forEach((ep) => {
      const epNum = ep.attributes?.number || ep.attributes?.relativeNumber;
      const synopsis = ep.attributes?.synopsis || ep.attributes?.description;
      if (epNum && synopsis) {
        synopsisMap[epNum] = synopsis;
      }
    });

    return synopsisMap;
  } catch (err) {
    console.error("Failed to fetch Kitsu episodes", err);
    return {};
  }
}

