import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useDebounce } from "../../lib/hooks/useDebounce";
import { type AnimeItem } from "../../lib/types";
import { searchAnimeForArc } from "./api";

interface AnimeSearchDropdownProps {
  onSelect: (anime: AnimeItem) => void;
}

export function AnimeSearchDropdown({ onSelect }: AnimeSearchDropdownProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let isMounted = true;
    searchAnimeForArc(debouncedQuery)
      .then((data) => {
        if (isMounted) {
          setResults(data.data || []);
          setIsOpen(true);
        }
      })
      .catch(() => {
        // Silent catch for dropdown
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (anime: AnimeItem) => {
    onSelect(anime);
    setQuery("");
    setIsOpen(false);
  };

  const handleForceSearch = () => {
    // Already handled by debounce, but provides a visual button click
    if (query && !isOpen && results.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search anime..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleForceSearch()}
        />
        <Button variant="icon" onClick={handleForceSearch}>
          🔍
        </Button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-brand-bg border border-t-0 border-brand-border max-h-[280px] overflow-y-auto z-50 shadow-lg">
          {results.length === 0 ? (
            <div className="p-4 text-brand-muted text-[0.8rem]">
              No results
            </div>
          ) : (
            results.map((anime) => (
              <div
                key={anime.mal_id}
                onClick={() => handleSelect(anime)}
                className="flex items-center gap-3 p-3 cursor-pointer transition-colors duration-150 border-b border-brand-border last:border-b-0 hover:bg-brand-surface2"
              >
                <img
                  src={anime.images?.jpg?.image_url || ""}
                  alt={anime.title}
                  className="w-8 h-11 object-cover rounded-[2px] shrink-0 bg-brand-surface"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[0.82rem] whitespace-nowrap overflow-hidden text-ellipsis">
                    {anime.title}
                  </div>
                  <div className="text-[0.65rem] text-brand-muted font-space mt-0.5">
                    {anime.type || ""} ·{" "}
                    {anime.episodes ? `${anime.episodes} eps` : "?"} · ★
                    {anime.score || "?"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
