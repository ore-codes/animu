# Contributing to Animu

Thanks for helping. Animu is small, so the easiest way to contribute is often a bug report with the show and the scene description that went wrong.

## Reporting a bad match

Open an issue with the show, what you typed, the episode you expected and the episode you got. These reports are the most useful thing you can send, because they show where search or re-ranking falls short.

## Setting up

You need Node 22 or newer and Docker.

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run ingest -- "hunter x hunter" 2011
npm run dev
```

The default setup uses a small local embedding model, so you do not need an API key. AI re-ranking and recaps need `GEMINI_API_KEY` and `GEMINI_MODEL`; without them the app falls back to meaning search only, which is fine for most changes.

## Before you open a pull request

```bash
npm run typecheck
npm test
```

Database tests run when `DATABASE_URL` points at a local Postgres:

```bash
DATABASE_URL=postgres://animu:animu@localhost:5433/animu npm test
```

If you change search, embeddings or the re-rank prompt, also run `npm run calibrate` and say how the scores moved in the pull request.

## Guidelines

- Keep pull requests small and about one thing.
- Follow the style of the code around your change.
- Add or update a test when behaviour changes.
- Never show anything past a customer's bookmark. Spoiler safety is the core promise of the app, so changes that expose titles, synopses or recaps of later episodes will not be merged.
- Do not commit `.env`, API keys or database URLs.
- Changing the embedding model or its size means every show must be re-ingested. Call that out in the pull request.

## Questions

Open an issue. There is no chat channel yet.
