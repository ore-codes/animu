import { useMemo } from "react";
import { cn } from "../../lib/utils";
import type { Episode } from "./types";

interface EpisodeMatchListProps {
  query: string;
  episodes: Episode[];
}

export function EpisodeMatchList({ query, episodes }: EpisodeMatchListProps) {
  const { matches, others, matchCount } = useMemo(() => {
    if (!query.trim()) {
      return { matches: [], others: episodes, matchCount: 0 };
    }

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const matchArr: Episode[] = [];
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

      const isMatch = terms.every((t) => combined.includes(t));
      if (isMatch) matchArr.push(ep);
      else otherArr.push(ep);
    });

    return { matches: matchArr, others: otherArr, matchCount: matchArr.length };
  }, [query, episodes]);

  const terms = useMemo(
    () =>
      query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    [query]
  );

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
        <div className="font-space text-[0.75rem] text-brand-muted">
          <span className="text-brand-pink">{matchCount}</span> matches
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {matches.map((ep) => renderEp(ep, true))}
        {others.map((ep) => renderEp(ep, false))}
        {matches.length === 0 && others.length === 0 && (
          <div className="text-brand-muted text-[0.8rem] py-4">
            No episodes available for this anime.
          </div>
        )}
      </div>
    </>
  );
}
