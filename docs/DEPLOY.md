# Deploying Animu

Target: the existing Vercel project behind animu.net (apex redirects to `www.animu.net`), with Neon Postgres and Gemini.

Do the steps in order. Steps 1 to 5 do not touch the live site. Step 6 replaces it.

## 1. Fix the Vercel project settings
The project was made for the old Vite app. In Vercel, open the project, then Settings, then Build and Deployment:
- Framework Preset: Next.js
- Build Command, Output Directory, Install Command: clear any override (toggle off)

If this is left on Vite, the first deploy fails or serves nothing.

## 2. Add the database
Vercel, Storage (or Marketplace), add Neon, connect it to this project. It sets `DATABASE_URL` for you.
pgvector is created by the first migration, so nothing else to enable.

## 3. Add environment variables
Vercel, Settings, Environment Variables. Production and Preview unless noted:

| Name | Value |
|---|---|
| `EMBEDDING_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | your key (the old project may already have one) |
| `GEMINI_EMBED_MODEL` | an embedding model your key can use, for example `gemini-embedding-001` |
| `GEMINI_MODEL` | a text model your key can use, for example `gemini-3.8-flash` |
| `GEMINI_EMBED_DIMENSIONS` | optional, for example `768` |
| `AI_DAILY_CALL_LIMIT` | optional, default 300 |
| `APP_ORIGIN` | `https://www.animu.net`, Production only |

Model names change. Confirm the two model names with the check in step 4, not from this table. The old `VITE_GEMINI_API_KEY` is no longer read and can be deleted.

## 4. Check the Gemini setup from your machine
Put the same values in your local `.env` (it is git-ignored), then:

```bash
npm run check:gemini
```

It makes one embedding call and one structured call and prints `ok` or `FAIL` for each. Fix any `FAIL` before going on. This is the only place the Gemini code is exercised for real, because none of it has run against the live API yet.

## 5. Set up the production database
Copy the Neon connection string, preferably the unpooled one, and run these from the repo with your Gemini values still in `.env`:

```bash
DATABASE_URL="<neon url>" npm run db:migrate
DATABASE_URL="<neon url>" npm run ingest -- "hunter x hunter" 2011
DATABASE_URL="<neon url>" npm run ingest -- "one piece" 1999
DATABASE_URL="<neon url>" npm run ingest -- "bleach" 2004
DATABASE_URL="<neon url>" npm run ingest -- "naruto shippuden" 2007
DATABASE_URL="<neon url>" npm run ingest -- "attack on titan" 2013
```

Ingesting these first means the popular shows work on day one instead of making the first visitor wait about a minute. Any other show is read on demand when someone first picks it.

## 6. Go live
Merge `feat/backend-v2` into `main`. Vercel builds and replaces animu.net.

## 7. Check the live site
```bash
curl -s "https://www.animu.net/api/shows/search?q=hunter%20x%20hunter"
curl -s -X POST https://www.animu.net/api/find -H 'content-type: application/json' -H 'origin: https://www.animu.net' \
  -d '{"tvmazeId":1536,"query":"the old chairman takes the ant king far away from the palace to fight him alone"}'
```
The first should list Hunter x Hunter as `ready`. The second should return `"mode":"ai"` with a reason on each match. If it says `"mode":"basic"` with a `notice`, the AI call failed or the daily cap is reached; the logs name the cause.

Then open the site, search, bookmark, and open "Previously on".

## Roll back
Vercel, Deployments, pick the last v1 deployment, Promote to Production. The database is not used by v1, so nothing else needs undoing.

## Limits to know about
- `POST /api/shows/:id/prepare` can run up to 300 seconds. Confirm your Vercel plan allows that function duration.
- Switching embedding model, size or provider means re-running ingest for every show.
- Rate limits and the AI cap are counted in Postgres. They stop casual abuse, not a determined attacker.
