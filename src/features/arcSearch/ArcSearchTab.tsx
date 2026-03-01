import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";
import { type AnimeItem } from "../../lib/types";
import { AnimeSearchDropdown } from "./AnimeSearchDropdown";
import { fetchAllEpisodes, fetchKitsuEpisodes } from "./api";
import { EpisodeMatchList } from "./EpisodeMatchList";
import { SelectedAnimeDisplay } from "./SelectedAnimeDisplay";
import { type Episode } from "./types";

export function ArcSearchTab() {
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);
  const [query, setQuery] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSelectAnime = (anime: AnimeItem) => {
    setSelectedAnime(anime);
    setEpisodes([]);
    setQuery("");
    setHasSearched(false);
  };

  const clearSelectedAnime = () => {
    setSelectedAnime(null);
    setEpisodes([]);
    setQuery("");
    setHasSearched(false);
  };

  const handleSearchArc = async () => {
    if (!selectedAnime) {
      showToast("Please select an anime first.");
      return;
    }
    if (!query.trim()) {
      showToast("Enter a search term.");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Fetch all episodes if not currently loaded for this anime
      if (episodes.length === 0) {
        // Run both fetching functions concurrently
        const [fetchedEps, kitsuSynopses] = await Promise.all([
          fetchAllEpisodes(selectedAnime.mal_id),
          fetchKitsuEpisodes(selectedAnime.mal_id)
        ]);
        
        // Merge Kitsu synopses into Jikan episodes
        const mergedEps = fetchedEps.map((ep: Episode) => {
          const epNum = ep.mal_id;
          if (kitsuSynopses[epNum]) {
            return { ...ep, synopsis: kitsuSynopses[epNum] };
          }
          return ep;
        });
        
        setEpisodes(mergedEps);
      }
    } catch {
      showToast("Failed to load episodes. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out grid grid-cols-1 md:grid-cols-[360px_1fr] gap-8 items-start">
      {/* Left Panel */}
      <div className="bg-brand-surface border border-brand-border p-6 md:sticky top-4">
        <h2 className="font-bebas text-3xl tracking-[0.1em] mb-1">
          Arc Search
        </h2>
        <p className="text-[0.8rem] text-brand-muted leading-relaxed mb-6">
          Find which episode an arc, event, or scene appeared in — using episode
          titles and synopses.
        </p>

        {selectedAnime ? (
          <SelectedAnimeDisplay
            anime={selectedAnime}
            onChange={clearSelectedAnime}
          />
        ) : (
          <AnimeSearchDropdown onSelect={handleSelectAnime} />
        )}

        <div className="mt-5">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink mb-2">
            Search Arc or Scene
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Marley arc, Frieza, Rengoku..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchArc()}
            />
            <Button variant="icon" onClick={handleSearchArc}>
              →
            </Button>
          </div>
          <p className="text-[0.7rem] text-brand-muted mt-2 leading-relaxed">
            Searches episode titles and synopses. Results depend on available
            data from MyAnimeList.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="min-h-[400px]">
        {loading ? (
          <Spinner label="LOADING EPISODES..." />
        ) : !selectedAnime ? (
          <EmptyState
            title="SELECT"
            description="Choose an anime on the left, then search for an arc or scene."
          />
        ) : !hasSearched ? (
          <div className="text-brand-muted font-space text-[0.8rem] py-4">
            Enter a search term to find episodes.
          </div>
        ) : (
          <EpisodeMatchList query={query} episodes={episodes} />
        )}
      </div>
    </div>
  );
}
