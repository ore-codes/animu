import { type AnimeItem } from "../../lib/types";
import { AnimeCard } from "./AnimeCard";

interface AnimeGridProps {
  items: AnimeItem[];
  total: number;
}

export function AnimeGrid({ items, total }: AnimeGridProps) {
  if (items.length === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="font-space text-[0.75rem] text-brand-muted">
          Showing <span className="text-brand-pink">{total.toLocaleString()}</span> results
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
        {items.map((anime) => (
          <AnimeCard key={anime.mal_id} anime={anime} />
        ))}
      </div>
    </>
  );
}
