import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { cn } from "../../lib/utils";
import type { AiSearchResponse } from "./aiSearchApi";
import type { Episode } from "./types";

interface EpisodeMatchListProps {
  query: string;
  episodes: Episode[];
  onAskAi: () => void;
  isAiLoading: boolean;
  aiData: AiSearchResponse | null;
}

export function EpisodeMatchList({ 
  query, 
  episodes,
  onAskAi,
  isAiLoading,
  aiData
}: EpisodeMatchListProps) {
  const { matches, others, aiMatches, matchCount } = useMemo(() => {
    if (!query.trim()) {
      return { matches: [], others: episodes, aiMatches: [], matchCount: 0 };
    }

    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", 
      "when", "how", "what", "where", "why", "who", "is", "are", "was", "were", 
      "met", "first", "time", "does", "do", "did", "of", "from", "by", "about", 
      "as", "into", "like", "through", "after", "over", "between", "out", 
      "against", "during", "without", "before", "under", "around", "among", "it", "then", "there", "their"
    ]);

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t && !stopWords.has(t));

    if (terms.length === 0) {
      return { matches: [], others: episodes, aiMatches: [], matchCount: 0 };
    }

    const matchArr: (Episode & { score: number })[] = [];
    const otherArr: Episode[] = [];

    episodes.forEach((ep) => {
      const titleStr = (
        ep.title ||
        ep.title_romanji ||
        ep.title_japanese ||
        ""
      ).toLowerCase();
      const synopsisStr = (ep.synopsis || "").toLowerCase();
      const combined = titleStr + " " + synopsisStr;

      let score = 0;
      terms.forEach((t) => {
        if (combined.includes(t)) {
          // Weight title matches higher than synopsis matches
          score += titleStr.includes(t) ? 3 : 1;
        }
      });

      if (score > 0) {
        matchArr.push({ ...ep, score });
      } else {
        otherArr.push(ep);
      }
    });

        // Sort matches by highest score
    matchArr.sort((a, b) => b.score - a.score);

    // If AI data exists, split out the AI matched episodes from the rest
    let aiMatches: Episode[] = [];
    if (aiData) {
      const aiIds = new Set(aiData.matchedEpisodes);
      aiMatches = episodes.filter(ep => aiIds.has(ep.mal_id));
      
      // Remove AI matches from local match lists to avoid duplication
      for (let i = matchArr.length - 1; i >= 0; i--) {
        if (aiIds.has(matchArr[i].mal_id)) matchArr.splice(i, 1);
      }
      for (let i = otherArr.length - 1; i >= 0; i--) {
        if (aiIds.has(otherArr[i].mal_id)) otherArr.splice(i, 1);
      }
    }

    return { 
      matches: matchArr, 
      others: otherArr, 
      aiMatches,
      matchCount: matchArr.length + aiMatches.length 
    };
  }, [query, episodes, aiData]);

  const terms = useMemo(() => {
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", 
      "when", "how", "what", "where", "why", "who", "is", "are", "was", "were", 
      "met", "first", "time", "does", "do", "did", "of", "from", "by", "about", 
      "as", "into", "like", "through", "after", "over", "between", "out", 
      "against", "during", "without", "before", "under", "around", "among", "it", "then", "there", "their"
    ]);
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t && !stopWords.has(t));
  }, [query]);

  const highlightTerms = (text: string) => {
    if (!terms.length) return text;
    let result = text;
    terms.forEach((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(
        new RegExp(`(${escaped})`, "gi"),
        '<span class="bg-brand-pink/25 text-brand-pink rounded-[2px] px-[2px]">$1</span>'
      );
    });
    return result;
  };

  const renderEp = (ep: Episode, isHighlight: boolean) => {
    const title =
      ep.title || ep.title_romanji || ep.title_japanese || `Episode ${ep.mal_id}`;
    let synopsis = ep.synopsis || "";

    if (synopsis.length > 200) {
      synopsis = synopsis.substring(0, 200) + "…";
    }

    return (
      <div
        key={ep.mal_id}
        className={cn(
          "bg-brand-surface border border-brand-border p-4 grid grid-cols-[3.5rem_1fr] gap-[0.8rem] items-center transition-all duration-200 rounded-[4px]",
          "hover:border-brand-indigo hover:bg-brand-surface2",
          isHighlight && "border-brand-pink bg-brand-pink/5"
        )}
      >
        <div
          className={cn(
            "font-bebas text-2xl text-center leading-none text-brand-muted",
            isHighlight && "text-brand-pink"
          )}
        >
          {ep.mal_id}
        </div>
        <div>
          {ep.animeTitle && (
            <div className="text-[0.65rem] font-bold text-brand-cyan tracking-wider uppercase mb-0.5 opacity-80">
              {ep.animeTitle}
            </div>
          )}
          <div
            className="text-[0.85rem] font-bold leading-tight"
            dangerouslySetInnerHTML={{ __html: highlightTerms(title) }}
          />
          <div
            className="text-[0.75rem] text-brand-muted mt-1 leading-relaxed line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: synopsis
                ? highlightTerms(synopsis)
                : '<span class="text-brand-muted text-[0.72rem]">No synopsis available.</span>',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bebas text-2xl tracking-[0.1em]">EPISODES</h3>
        <div className="flex items-center gap-4">
          <div className="font-space text-[0.75rem] text-brand-muted">
            <span className="text-brand-pink">{matchCount}</span> matches
          </div>
          {!aiData && !isAiLoading && query.trim() && (
            <Button onClick={onAskAi} variant="primary" className="py-1 px-4 text-[0.75rem] flex items-center gap-1.5">
              Ask AI Deep Search <Sparkles className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      
      {isAiLoading && (
        <div className="my-8">
          <Spinner label="Consulting AI Database..." />
        </div>
      )}

      {aiData && (
        <div className="bg-brand-surface2 border border-brand-cyan/30 rounded-lg p-5 mb-6 shadow-[0_0_20px_rgba(0,212,255,0.05)]">
          <h4 className="font-bebas text-xl text-brand-cyan mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Discovery
          </h4>
          <p className="text-[0.8rem] text-brand-muted leading-relaxed">
            {aiData.explanation}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {aiData && aiMatches.map((ep) => renderEp(ep, true))}
        {matches.map((ep) => renderEp(ep, !aiData))} {/* Only highlight local if no AI results overshadow them */}
        {others.map((ep) => renderEp(ep, false))}
        {matches.length === 0 && others.length === 0 && aiMatches.length === 0 && (
          <div className="text-brand-muted text-[0.8rem] py-4">
            No episodes available for this anime.
          </div>
        )}
      </div>
    </>
  );
}
