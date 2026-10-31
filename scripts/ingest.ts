// Usage: npm run ingest -- "hunter x hunter" 2011
import { sql } from '../src/lib/db';
import { claimIngest, ingestFranchise, upsertFranchise } from '../src/server/ingest/run';
import { searchShows } from '../src/server/sources/tvmaze';

const [query, year] = process.argv.slice(2);
if (!query) {
  console.error('Usage: npm run ingest -- "<title>" [year]');
  process.exit(1);
}

const hits = await searchShows(query);
const hit = hits.find((h) => !year || h.year === Number(year));
if (!hit) {
  console.error(`No anime found for "${query}"${year ? ` (${year})` : ''}. Candidates: ${hits.map((h) => `${h.title} ${h.year}`).join(', ') || 'none'}`);
  process.exit(1);
}

const franchise = await upsertFranchise(hit);
if (!(await claimIngest(franchise.id))) {
  console.error('An ingest for this show is already running');
  process.exit(1);
}

console.log(`Ingesting ${hit.title} (${hit.year}) ...`);
const started = Date.now();
await ingestFranchise(franchise.id);
const [done] = await sql()`select episode_count, synopsis_source from franchise where id = ${franchise.id}`;
console.log(`Done in ${Math.round((Date.now() - started) / 1000)}s: ${done.episode_count} episodes from ${done.synopsis_source}`);
await sql().end();
