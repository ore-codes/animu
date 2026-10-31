# Animu

Find the episode you left off at. Pick a show, describe a scene you half remember, and Animu names the likely episode with no spoilers past it.

This branch is the v2 backend. The interface is not built yet; the designs are in `docs/DESIGN.md`.

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

## License

MIT
