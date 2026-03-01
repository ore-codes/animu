import { BrainCircuit } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";
import { type AnimeItem } from "../../lib/types";
import { AnimeSearchDropdown } from "../arcSearch/AnimeSearchDropdown";
import { fetchEpisodesWithSynopses } from "../arcSearch/api";
import { SelectedAnimeDisplay } from "../arcSearch/SelectedAnimeDisplay";
import { type Episode } from "../arcSearch/types";
import { MoodGraph } from "./MoodGraph";
import { analyzeSynopses, type SentimentAnalysisResponse } from "./sentimentApi";

export function SentimentMapTab() {
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleSelectAnime = (anime: AnimeItem) => {
    setSelectedAnime(anime);
    setEpisodes([]);
    setSentimentData(null);
    setHasAnalyzed(false);
  };

  const clearSelectedAnime = () => {
    setSelectedAnime(null);
    setEpisodes([]);
    setSentimentData(null);
    setHasAnalyzed(false);
  };

  const handleAnalyze = async () => {
    if (!selectedAnime) return;

    setLoading(true);
    setHasAnalyzed(true);

    try {
      // 1. Fetch Episodes and integrate synopses from Jikan + Kitsu
      let currentEps = episodes;
      if (currentEps.length === 0) {
        currentEps = await fetchEpisodesWithSynopses(selectedAnime);
        setEpisodes(currentEps);
      }
      
      if (currentEps.length === 0) {
        showToast("No episodes found for this anime to analyze.");
        setLoading(false);
        return;
      }

      // 2. Perform AI Sentiment Analysis
      const analysis = await analyzeSynopses(selectedAnime.mal_id, currentEps);
      setSentimentData(analysis);
      
    } catch (error) {
      console.error(error);
      showToast("There was an error generating the sentiment map.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 h-full min-h-[600px]">
      {/* Left Panel: Controls */}
      <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
        <div className="bg-surface2/50 border border-white/5 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <h2 className="font-bebas text-2xl tracking-wider text-pink mb-4">Sentiment Map</h2>
          <p className="text-sm text-text/80 leading-relaxed mb-6 font-space">
            Discover the emotional trajectory of an anime. Our AI will analyze the synopsis of every episode and graph whether it is dark and tragic (-1) or wholesome and triumphant (+1).
          </p>

          {!selectedAnime ? (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-muted uppercase tracking-wider">
                Find Anime
              </label>
              <AnimeSearchDropdown onSelect={handleSelectAnime} />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-muted uppercase tracking-wider mb-2">
                  Selected Series
                </label>
                <SelectedAnimeDisplay anime={selectedAnime} onChange={clearSelectedAnime} />
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button 
                  variant="primary" 
                  className="w-full justify-center group"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  <BrainCircuit className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                  {loading ? "Analyzing..." : sentimentData !== null ? "Re-Analyze" : "Generate Map"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: The Graph and Summary */}
      <div className="flex-1 min-h-[400px] bg-surface2/30 border border-white/5 rounded-xl p-4 sm:p-6 backdrop-blur-sm relative overflow-hidden flex flex-col">
        {loading ? (
          <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
            <Spinner label="Analyzing Synopses with AI..." />
          </div>
        ) : null}

        {!hasAnalyzed && !loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <BrainCircuit className="w-12 h-12 text-muted" />
              <EmptyState 
                title="Awaiting Analysis"
                description="Select an anime and initiate the scan to view its emotional journey."
              />
            </div>
          </div>
        ) : sentimentData !== null ? (
          <div className="flex flex-col h-full w-full">
            <MoodGraph data={sentimentData.episodes} />
            <div className="mt-8 bg-surface/50 border border-white/10 p-5 rounded-lg border-l-2 border-l-brand-pink">
              <h4 className="font-bebas tracking-wide text-brand-pink text-xl mb-2">AI Overview</h4>
              <p className="font-space text-sm text-brand-text/90 leading-relaxed italic">{sentimentData.summary}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
