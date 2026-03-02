import { Sparkles, Star } from "lucide-react";
import { type AnimeItem } from "../../lib/types";
import { cn } from "../../lib/utils";

interface AnimeCardProps {
  anime: AnimeItem;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const isAiring = anime.status === "Currently Airing";
  const isUpcoming = anime.status === "Not yet aired";

  const statusBadge = isAiring
    ? "bg-brand-pink text-white"
    : isUpcoming
    ? "bg-brand-cyan text-black"
    : "bg-brand-indigo text-white";

  const statusLabel = isAiring
    ? "Airing"
    : isUpcoming
    ? "Upcoming"
    : "Finished";

  const imgUrl = anime.images?.jpg?.image_url;

  return (
    <div
      onClick={() => window.open(`https://myanimelist.net/anime/${anime.mal_id}`, "_blank")}
      className="bg-brand-surface border border-brand-border rounded-[4px] overflow-hidden cursor-pointer transition-all duration-200 relative hover:-translate-y-1 hover:border-brand-pink hover:shadow-[0_8px_30px_rgba(255,75,139,0.15)]"
    >
      <span
        className={cn(
          "absolute top-2 left-2 font-space text-[0.55rem] tracking-[0.1em] uppercase px-2 py-[0.2rem] rounded-[2px]",
          statusBadge
        )}
      >
        {statusLabel}
      </span>
      {imgUrl ? (
        <img
          className="w-full aspect-[3/4] object-cover block bg-brand-surface2"
          src={imgUrl}
          alt={anime.title_english || anime.title}
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-[3/4] bg-brand-surface2 flex items-center justify-center text-brand-muted">
          <Sparkles className="w-10 h-10 opacity-30" />
        </div>
      )}
      <div className="p-3.5">
        <div className="text-[0.85rem] font-bold leading-tight mb-1.5 line-clamp-2">
          {anime.title_english || anime.title}
        </div>
        <div className="flex items-center justify-between font-space text-[0.65rem] text-brand-muted">
          <span>
            {anime.type || "—"} · {anime.episodes ? `${anime.episodes} eps` : "?"}
          </span>
          <span className="text-brand-gold font-bold flex items-center gap-1">
            {anime.score ? (
              <>
                <Star className="w-3 h-3 fill-current" />
                {anime.score}
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
