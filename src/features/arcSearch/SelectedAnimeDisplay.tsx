import { type AnimeItem } from "../../lib/types";

interface SelectedAnimeDisplayProps {
  anime: AnimeItem;
  onChange: () => void;
}

export function SelectedAnimeDisplay({ anime, onChange }: SelectedAnimeDisplayProps) {
  return (
    <div className="flex bg-brand-surface2 border border-brand-border p-4 mb-4 items-center gap-4">
      <img
        src={anime.images?.jpg?.image_url || ""}
        alt={anime.title}
        className="w-[50px] h-[70px] object-cover rounded-[2px]"
      />
      <div>
        <div className="text-[0.9rem] font-bold">{anime.title}</div>
        <div className="text-[0.7rem] text-brand-muted font-space mt-1">
          MAL ID: {anime.mal_id} · {anime.episodes || "?"} episodes
        </div>
      </div>
      <button
        onClick={onChange}
        className="font-space text-[0.6rem] bg-transparent border border-brand-border text-brand-muted px-2.5 py-1 cursor-pointer ml-auto whitespace-nowrap rounded-[4px] transition-all duration-200 hover:border-brand-pink hover:text-brand-text"
      >
        CHANGE
      </button>
    </div>
  );
}
