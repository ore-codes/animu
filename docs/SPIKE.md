# Spike results: data quality and search

Branch `spike/data-quality`. Scripts live in `spike/`. Run in order: `ingest.mjs`, `search.mjs`.

## Data
Usable synopsis (60+ characters) per show, best source chosen per show:

| Show | Source used | Episodes kept |
|---|---|---|
| Hunter x Hunter (2011) | Kitsu | 148 of 148 |
| One Piece | TVmaze | 1160 of 1181 |
| Bleach | Kitsu | 363 of 366 |
| Naruto Shippuden | TVmaze | 499 of 500 |
| Attack on Titan | TVmaze | 86 of 89 |

Kitsu alone covers only 8 percent of One Piece and 12 percent of Naruto Shippuden. TVmaze alone covers 20 percent of Bleach. Neither source is enough alone, so ingest needs both with a per-show choice.

## Search
25 hand-written scenes, each with the accepted episode numbers. Local model `bge-small-en-v1.5`, search restricted to one show.

| Method | Top 1 | Top 3 | Top 5 | Top 10 |
|---|---|---|---|---|
| Keyword | 44% | 52% | 68% | 72% |
| Embedding | 48% | 76% | 84% | 92% |
| Keyword plus embedding (naive) | 52% | 72% | 72% | 80% |

## Reading the results
- Embeddings beat keywords clearly. Top 3 at 76 percent is a workable base before any re-ranking.
- Naive blending of keyword and embedding rank made things worse. Use embeddings first and drop the keyword boost unless a better blend is tested.
- Two real misses show the limits of synopsis-only search: the Gear 5 episode (the synopsis does not describe the scene) and one Bleach flashback (query too vague). The LLM re-rank step and an "ask the model" fallback are for these.
- The scenes were written by the same author who read the data, so real users will be vaguer. Treat these numbers as an upper bound.

## Caveats
- Accepted episode numbers were pinned against synopsis text and need a second pair of eyes from someone who knows the shows.
- TVmaze episode order can drift a few episodes from official numbering on very long shows.
