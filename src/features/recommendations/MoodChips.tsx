import { cn } from "../../lib/utils";

import {
    Bot,
    Brain,
    Flower2,
    Ghost,
    HeartCrack,
    Laugh,
    Smile,
    Trophy,
    Wand2,
    Zap
} from "lucide-react";

interface Mood {
  label: string;
  genres: string;
  icon: React.ReactNode;
}

const MOODS: Mood[] = [
  { label: "Feel-Good", genres: "4,36", icon: <Smile className="w-4 h-4 mr-2" /> },
  { label: "Hype & Intense", genres: "1,37", icon: <Zap className="w-4 h-4 mr-2" /> },
  { label: "Emotional Rollercoaster", genres: "8", icon: <HeartCrack className="w-4 h-4 mr-2" /> },
  { label: "Dark & Eerie", genres: "14,37", icon: <Ghost className="w-4 h-4 mr-2" /> },
  { label: "Wholesome Romance", genres: "22,36", icon: <Flower2 className="w-4 h-4 mr-2" /> },
  { label: "Mind-Bending", genres: "7,41", icon: <Brain className="w-4 h-4 mr-2" /> },
  { label: "Sci-Fi & Futuristic", genres: "24,63", icon: <Bot className="w-4 h-4 mr-2" /> },
  { label: "Fantasy Adventure", genres: "10,62", icon: <Wand2 className="w-4 h-4 mr-2" /> },
  { label: "Just Laughs", genres: "4", icon: <Laugh className="w-4 h-4 mr-2" /> },
  { label: "Underdog Rising", genres: "30", icon: <Trophy className="w-4 h-4 mr-2" /> },
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
                "px-4 py-1.5 flex items-center border border-brand-border rounded-full text-[0.75rem] cursor-pointer transition-all duration-200 bg-transparent font-space text-brand-muted hover:border-brand-pink hover:text-brand-text",
                isActive && "bg-brand-pink border-brand-pink text-white hover:text-white"
              )}
            >
              {mood.icon}
              {mood.label}
            </button>
        );
      })}
    </div>
  );
}
