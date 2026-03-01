import React from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { MoodChips } from "./MoodChips";
import type { SearchFilters } from "./api";

interface FilterPanelProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  onSearch: () => void;
  onReset: () => void;
}

export function FilterPanel({
  filters,
  setFilters,
  onSearch,
  onReset,
}: FilterPanelProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMoodSelect = (genres: string | undefined) => {
    setFilters((prev) => ({ ...prev, moodGenres: genres }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="bg-brand-surface border border-brand-border p-8 mb-8 relative overflow-hidden after:content-['FILTERS'] after:absolute after:top-4 after:right-6 after:font-bebas after:text-[5rem] after:text-brand-border after:pointer-events-none after:tracking-[0.2em] after:opacity-50">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[1.2rem] relative z-10 w-full lg:w-4/5">
        <div className="flex flex-col gap-2">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink">
            Search Title
          </label>
          <Input
            name="title"
            value={filters.title}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Attack on Titan"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink">
            Airing Status
          </label>
          <Select name="status" value={filters.status} onChange={handleChange}>
            <option value="">Any</option>
            <option value="airing">Currently Airing</option>
            <option value="complete">Finished Airing</option>
            <option value="upcoming">Upcoming</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink">
            Type
          </label>
          <Select name="type" value={filters.type} onChange={handleChange}>
            <option value="">Any</option>
            <option value="tv">TV Series</option>
            <option value="movie">Movie</option>
            <option value="ova">OVA</option>
            <option value="ona">ONA</option>
            <option value="special">Special</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink">
            Age Rating
          </label>
          <Select name="rating" value={filters.rating} onChange={handleChange}>
            <option value="">Any</option>
            <option value="g">G — All Ages</option>
            <option value="pg">PG — Children</option>
            <option value="pg13">PG-13</option>
            <option value="r17">R — 17+</option>
            <option value="r">R+ Mild Nudity</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink">
            Sort By
          </label>
          <Select name="order" value={filters.order} onChange={handleChange}>
            <option value="popularity">Popularity</option>
            <option value="score">Highest Score</option>
            <option value="rank">Rank</option>
            <option value="members">Most Members</option>
            <option value="favorites">Most Favorited</option>
            <option value="start_date">Newest</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink">
            Min Score
          </label>
          <Select name="score" value={filters.score} onChange={handleChange}>
            <option value="">Any</option>
            <option value="9">9+ Masterpiece</option>
            <option value="8">8+ Excellent</option>
            <option value="7">7+ Good</option>
            <option value="6">6+ Decent</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink">
            Genre
          </label>
          <Select name="genre" value={filters.genre} onChange={handleChange}>
            <option value="">Any</option>
            <option value="1">Action</option>
            <option value="2">Adventure</option>
            <option value="4">Comedy</option>
            <option value="8">Drama</option>
            <option value="10">Fantasy</option>
            <option value="14">Horror</option>
            <option value="7">Mystery</option>
            <option value="22">Romance</option>
            <option value="24">Sci-Fi</option>
            <option value="36">Slice of Life</option>
            <option value="30">Sports</option>
            <option value="37">Supernatural</option>
            <option value="41">Thriller</option>
            <option value="62">Isekai</option>
            <option value="63">Mecha</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2 col-span-full">
          <label className="block font-space text-[0.6rem] tracking-[0.25em] uppercase text-brand-pink">
            Mood / Vibe
          </label>
          <MoodChips
            activeMoodGeners={filters.moodGenres}
            onSelect={handleMoodSelect}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-6 relative z-10 w-full max-w-[500px]">
        <Button variant="primary" onClick={onSearch}>
          SEARCH ANIME
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
