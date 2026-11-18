# Maintenance

What runs on its own, and what to do when it asks for you.

## What runs on its own

| What | When | Where |
|---|---|---|
| Live check of animu.net (search, map, recap, AI-ranked find) | Daily, 06:17 UTC | `.github/workflows/live-check.yml`, `scripts/smoke.mjs` |
| Dependency updates | Weekly (npm), monthly (Actions) | `.github/dependabot.yml` |
| Merge of patch and minor updates once CI passes | On each Dependabot pull request | `.github/workflows/dependabot-merge.yml` |
| Type check and tests | Every push and pull request | `.github/workflows/ci.yml` |

Major version updates are never merged automatically. `typescript` and `@types/node` majors are ignored on purpose.

## When the live check fails

It opens an issue labelled `outage` and closes it itself when the check passes again. Look at the failing line:

- **find answers with AI ranking** fails: Gemini is overloaded, the model name changed, or the prepay balance is empty. Check `GEMINI_MODEL` in Vercel and the balance in AI Studio. Change the model, then redeploy, since environment changes need a redeploy.
- **show search** or **episode map** fails: the database (Neon) or TVmaze is down, or an ingest broke. Check Vercel logs.
- **home page loads** fails: the deploy is broken. In Vercel, Deployments, promote the last good one.

Run the check yourself any time: `node scripts/smoke.mjs`, or the "Live check" workflow from the Actions tab.

## Major updates

Test them before merging: check out the branch, run `npm ci`, `npm run typecheck`, `npm test` with `DATABASE_URL` set, and `npm run build`. After a `next` or `postgres` major goes live, run the live check.
