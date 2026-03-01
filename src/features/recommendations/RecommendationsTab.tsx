import { useEffect, useState } from "react";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";
import { type AnimeItem } from "../../lib/types";
import { AnimeGrid } from "./AnimeGrid";
import { FilterPanel } from "./FilterPanel";
import { Pagination } from "./Pagination";
import type { SearchFilters } from "./api";
import { fetchAnimeRecommendations } from "./api";

const initialFilters: SearchFilters = {
  title: "",
  status: "",
  type: "",
  rating: "",
  order: "score",
  score: "",
  genre: "",
  moodGenres: undefined,
};

export function RecommendationsTab() {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // We only fetch when the user clicks 'SEARCH ANIME' or changes page
  const handleSearch = async (targetPage = 1) => {
    setLoading(true);
    setHasSearched(true);
    setPage(targetPage);
    try {
      const data = await fetchAnimeRecommendations(targetPage, filters);
      setResults(data.data || []);
      setTotalItems(data.pagination?.items?.total || data.data?.length || 0);
      setTotalPages(data.pagination?.last_visible_page || 1);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("429")) {
        showToast("Rate limited — please wait a moment and try again.");
      } else {
        showToast("Could not fetch results. Try again shortly.");
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setResults([]);
    setTotalItems(0);
    setTotalPages(1);
    setHasSearched(false);
    setPage(1);
  };

  // Initial load
  useEffect(() => {
    handleSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount for the initial load just like the HTML version did? Wait, HTML version didn't fetch on load. Actually, letting it be empty or default search is fine. Let's do a default search so it's not empty.

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        onSearch={() => handleSearch(1)}
        onReset={handleReset}
      />

      {loading ? (
        <Spinner />
      ) : hasSearched && results.length === 0 ? (
        <EmptyState
          description="No anime found. Try adjusting your filters."
        />
      ) : (
        <>
          <AnimeGrid items={results} total={totalItems} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handleSearch}
          />
        </>
      )}
    </div>
  );
}
