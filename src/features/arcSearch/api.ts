import type { AnimeItem, AnimeSearchResponse } from "../../lib/types";
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

export async function fetchEpisodesWithSynopses(anime: AnimeItem): Promise<Episode[]> {
  const allEps = await fetchFranchiseEpisodes(anime);
  return allEps;
}

export async function fetchFranchiseEpisodes(baseAnime: AnimeItem): Promise<Episode[]> {
  const baseAnimeId = baseAnime.mal_id;
  try {
    // 1. Traverse the franchise tree using BFS to find all related seasons
    const relatedIds = new Set<number>([baseAnimeId]);
    const queue: number[] = [baseAnimeId];
    
    // Map to store ID -> Title so we know which season each episode belongs to
    const titleMap = new Map<number, string>();
    titleMap.set(baseAnimeId, baseAnime.title_english || baseAnime.title);
    
    // Safety cap to avoid infinite loops or massive franchises (e.g., Fate, Pokemon) filling the queue
    let iterations = 0;
    const MAX_FRANCHISE_ENTRIES = 12; 

    while (queue.length > 0 && iterations < MAX_FRANCHISE_ENTRIES) {
      const currentId = queue.shift()!;
      iterations++;
      
      const relationsRes = await fetch(`https://api.jikan.moe/v4/anime/${currentId}/relations`);
      
      if (!relationsRes.ok) {
        if (relationsRes.status === 429) {
          await sleep(1500);
          queue.unshift(currentId); // Re-queue and try again
          continue;
        }
        continue;
      }
      
      const relationsData = await relationsRes.json();
      if (relationsData.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relationsData.data.forEach((relation: any) => {
          // Pull from the main storyline
          if (["Sequel", "Prequel", "Parent story", "Side story"].includes(relation.relation)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            relation.entry.forEach((entry: any) => {
              if (entry.type === "anime" && !relatedIds.has(entry.mal_id)) {
                relatedIds.add(entry.mal_id);
                queue.push(entry.mal_id);
                titleMap.set(entry.mal_id, entry.name);
              }
            });
          }
        });
      }
      
      // Sleep to prevent hitting rate limits during the crawl
      await sleep(400);
    }
    
    // Sort IDs to generally fetch older seasons first (lower MAL ID usually means older)
    const sortedIds = Array.from(relatedIds).sort((a, b) => a - b);

    // 2. Fetch episodes for all related IDs
    let allEpisodes: Episode[] = [];
    
    for (const malId of sortedIds) {
      const [fetchedEps, kitsuSynopses] = await Promise.all([
        fetchAllEpisodes(malId),
        fetchKitsuEpisodes(malId)
      ]);
      
      const mergedEps = fetchedEps.map((ep: Episode) => {
        const epNum = ep.mal_id;
        const mappedEp = { ...ep, animeTitle: titleMap.get(malId) };
        if (kitsuSynopses[epNum]) {
          return { ...mappedEp, synopsis: kitsuSynopses[epNum] };
        }
        return mappedEp;
      });

      // Adjust the episode numbers so they don't reset to 1 every season for the UI display.
      // E.g., if Season 1 has 25 eps, Season 2 ep 1 becomes ep 26 globally if possible.
      // But for simplicity of matching across data, we just append them.
      allEpisodes = allEpisodes.concat(mergedEps);
      
      // Safety throttle between seasons
      await sleep(1000); 
    }

    return allEpisodes;

  } catch (error) {
    console.error("Failed to fetch franchise episodes:", error);
    // Fallback to just the base season
    const [fetchedEps, kitsuSynopses] = await Promise.all([
      fetchAllEpisodes(baseAnimeId),
      fetchKitsuEpisodes(baseAnimeId)
    ]);
    
    return fetchedEps.map((ep: Episode) => {
      const epNum = ep.mal_id;
      const mappedEp = { ...ep, animeTitle: baseAnime.title_english || baseAnime.title };
      if (kitsuSynopses[epNum]) {
        return { ...mappedEp, synopsis: kitsuSynopses[epNum] };
      }
      return mappedEp;
    });
  }
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let episodesList: any[] = [];
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

