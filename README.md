# Animu

Find the episode you left off at. Pick a show, describe a scene you half remember, and Animu names the likely episode with no spoilers past it.

**Live at [animu.net](https://animu.net)**

- Describe a half-remembered scene and get up to 3 matching episodes, each with a confidence and a one-line reason.
- Bookmark your place. It is saved in your browser, with no account.
- See every episode of the show in one strip, with what you have watched and your bookmark marked.
- Read short "previously on" recaps of the episodes before your bookmark.
- Nothing past your match is shown: upcoming episodes appear as numbers only, never titles or plot.

Popular shows are ready instantly. Any other anime is read on demand and takes about a minute the first time. The designs are in `docs/DESIGN.md`.

## How it works

- `ingest` reads a show's episodes once from TVmaze and Kitsu, keeps the source with more usable synopses, embeds each episode, and stores everything in Postgres with pgvector.
- `find` embeds the description and returns the closest episodes. With AI configured, a re-rank step orders them and adds a reason and a confidence.
- `recap` returns "previously on" for the episodes before a position, each written only from that episode's own synopsis.
- Nothing at request time calls TVmaze or Kitsu except show search.

Measured quality on the spike scenes is in `docs/SPIKE.md`. Without AI the right episode is in the top 3 for about three quarters of scenes.

## Run it

```bash
cp .env.example .env
npm install
npm run db:up          # Postgres with pgvector on port 5433
npm run db:migrate
npm run ingest -- "hunter x hunter" 2011
npm run dev
```

## API

| Route | Purpose |
|---|---|
| `GET /api/shows/search?q=` | Find anime by title, with whether each is ready |
| `POST /api/shows/:id/prepare` | Start reading a show. Returns at once |
| `GET /api/shows/:id` | Status and progress while preparing |
| `POST /api/find` | `{ tvmazeId, query }` returns up to 3 matches and the kinds of the next 5 episodes |
| `GET /api/shows/:id/recap?upTo=N&count=3` | Recaps for the episodes before N |
| `GET /api/shows/:id/map` | Episode count and which episodes are recap or filler, for the episode strip |
| `GET /api/shows/:id/upcoming?after=N&reveal=1` | Next 5 episodes; titles only when revealed |

POST routes only accept the site's own origin. Every route is rate limited per address, and AI calls stop at `AI_DAILY_CALL_LIMIT` per day, after which results fall back to meaning search only.

## Test

```bash
npm test                                                    # unit tests
DATABASE_URL=postgres://animu:animu@localhost:5433/animu npm test   # plus database tests
npm run calibrate                                           # score the spike scenes against the database
```

## Embeddings

Development uses a small local model. Production should use the hosted provider (`EMBEDDING_PROVIDER=gemini`) because the local model is too heavy for a serverless function. Vectors record which model made them, and search only compares vectors from the current model, so switching means re-running ingest for every show.

## Contributing

Bad matches, bugs and ideas are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines, and [SECURITY.md](SECURITY.md) to report a vulnerability.

## License

[MIT](LICENSE)
