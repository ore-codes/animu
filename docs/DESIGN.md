# Animu v2 design

Status: draft for sign-off. Nothing here is built yet.

## 1. Product

**One job:** "I stopped watching a long show a while ago. Tell me which episode I'm on."

Input: a show plus a half-remembered scene, character, or arc.
Output: the most likely episode(s) in global franchise order, a spoiler-safe recap of the episodes just before it, and a one-click way to remember the position.

### Principles
- Position beats search. The result is "you are here", not a ranked list to browse.
- Never spoil. Nothing after the user's matched or saved position is ever shown.
- Instant. A result for a known franchise returns in under 3 seconds. No crawling at request time.
- Honest. Show a confidence score and let the user pick a neighbour episode. Never present a guess as fact.

### Features
| Feature | v1 | Notes |
|---|---|---|
| Resume finder (describe a scene, get an episode) | yes | The core |
| Spoiler-safe recap of previous 3 episodes | yes | LLM, cached per episode |
| Saved position, per browser | yes | `localStorage`, no account |
| Canon vs recap/filler markers | yes | Shown as a strip, helps decide what to skip |
| Import from AniList/MAL list | later | Seeds "continue watching" |
| Accounts, sync across devices | later | Only if people ask |
| Sentiment map | cut from v1 | Revisit as a small extra if the data is good |
| Recommendations tab | cut | Off-mission, and the existing one depends on Jikan |

## 2. Screens
1. **Home:** show picker, free-text "what do you remember", primary action, and a "continue watching" list from saved positions.
2. **Result:** best match as a highlighted card (title, series/season/arc, confidence, one-line synopsis), two alternates, actions "I'm here, save it" and "Recap last 3 eps", plus a canon/filler strip for the next episodes.
3. **Recap drawer:** three short recaps, each strictly about episodes before the position.

Visual language carries over from v1: dark base (`#07080f`), pink primary action, cyan for data, Bebas Neue headings, Outfit body. One pink primary button per screen.

## 3. Architecture

Next.js (App Router) on Vercel, Postgres with pgvector (Neon or Supabase), one ingest worker.

```
Browser ──> Next.js route handlers ──> Postgres (franchises, episodes, vectors, cache)
                     │                         ▲
                     └──> LLM (re-rank, recap) │
Ingest job (cron/manual) ──> AniList (+ synopsis source) ──> normalise ──> embed ──> Postgres
```

Request-time code never calls AniList, Jikan, or Kitsu. Only the ingest job does.

### Data model (sketch)
- `franchise(id, title, slug, anilist_root_id)`
- `series(id, franchise_id, anilist_id, mal_id, title, format, order_index, episode_count)`
- `episode(id, series_id, franchise_id, number_in_series, global_order, title, synopsis, kind[canon|recap|filler|special], embedding vector, source)`
- `recap_cache(episode_id, text, model, created_at)`
- `query_cache(franchise_id, query_hash, result_json, created_at)`
- `ingest_run(id, franchise_id, status, error, started_at)`

`global_order` is the fix for v1's "episode numbers reset every season". It is assigned at ingest from the series order, with specials and recaps flagged by `kind` rather than silently interleaved.

### Ingest
1. Resolve the franchise from AniList relations (sequel/prequel/parent), dedupe by AniList id, order by start date.
2. Pull episode lists and titles. Fill synopses from the best available source.
3. Classify `kind` where the source says so.
4. Embed `title + synopsis`. Upsert idempotently.
5. Lazy on first request for an unknown show: return "preparing this show" and finish within a bounded time, rather than blocking a request on a 12-season crawl.

### Search
1. Embed the query.
2. Vector search within the franchise, top 15.
3. Keyword/trigram boost for exact names (character names, arc names).
4. LLM re-rank of the top 15 only, with episode titles and synopses, returning the top 3 with confidence. Cached by `(franchise, normalised query)`.
5. Recaps generated on demand for the three episodes before the match and cached forever.

Cost shape: one embedding plus one small LLM call per novel query, near zero for repeats.

### Public hardening
- Per-IP rate limit on every route that can reach an LLM (Upstash Redis or Vercel KV), plus a global daily LLM budget that fails closed to vector-only results.
- Same-origin only, no `Access-Control-Allow-Origin: *`.
- Keys server-side only. Input length limits. Strict response schemas.
- Model name and embedding model come from env, not code.

## 4. Risks and open questions
1. **Synopsis source is the biggest risk.** AniList returns episode titles but I have not verified it returns synopses. Kitsu has synopses with patchy coverage. If long-running shows have thin synopses, search quality drops. Mitigation: a spike on 5 shows (HxH, One Piece, Bleach, Naruto, Attack on Titan) before any UI, measuring how often the true episode lands in the top 3.
2. **Franchise graph correctness.** Remakes (HxH 1999 vs 2011) must not be merged. Ingest needs a "which series" choice step when a franchise has parallel continuities.
3. **Ground truth.** To measure quality we need a small hand-built set of (show, scene description, correct episode) cases. I will build ~30.
4. **Legal.** We store titles and short synopses for search only, link out to sources, and show no video or images beyond what the APIs permit. Worth a check of AniList and Kitsu terms before launch.

## 5. Milestones
1. **Spike:** ingest 5 franchises, run vector search, score against the ground-truth set. Go/no-go on data quality.
2. **Backend:** schema, ingest job, search and recap endpoints, rate limiting.
3. **Frontend:** home, result, recap drawer, saved positions.
4. **Launch hardening:** budgets, monitoring, error states, empty states.
5. **After launch:** list import, accounts, sentiment map revival.

## 6. Out of scope for v1
Accounts, comments, ratings, recommendations, streaming links, mobile app.
