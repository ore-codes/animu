import { cn } from "../../lib/utils";

interface Mood {
  label: string;
  genres: string;
}

const MOODS: Mood[] = [
  { label: "😌 Feel-Good", genres: "4,36" },
  { label: "⚡ Hype & Intense", genres: "1,37" },
  { label: "💔 Emotional Rollercoaster", genres: "8" },
  { label: "😨 Dark & Eerie", genres: "14,37" },
  { label: "🌸 Wholesome Romance", genres: "22,36" },
  { label: "🔍 Mind-Bending", genres: "7,41" },
  { label: "🤖 Sci-Fi & Futuristic", genres: "24,63" },
  { label: "🧙 Fantasy Adventure", genres: "10,62" },
  { label: "😂 Just Laughs", genres: "4" },
  { label: "🏆 Underdog Rising", genres: "30" },
];

interface MoodChipsProps {
  activeMoodGeners?: string;
  onSelect: (genres: string | undefined) => void;
}

export function MoodChips({ activeMoodGeners, onSelect }: MoodChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 col-span-full">
      {MOODS.map((mood) => {
        const isActive = activeMoodGeners === mood.genres;
        return (
          <button
            key={mood.label}
            onClick={() => onSelect(isActive ? undefined : mood.genres)}
            className={cn(
              "px-4 py-1.5 border border-brand-border rounded-full text-[0.75rem] cursor-pointer transition-all duration-200 bg-transparent font-space text-brand-muted hover:border-brand-pink hover:text-brand-text",
              isActive && "bg-brand-pink border-brand-pink text-white hover:text-white"
            )}
          >
            {mood.label}
          </button>
        );
      })}
    </div>
  );
}
