// Scores the spike scenes against the live database and prints similarity cut-offs for confidence bands.
// Usage: npm run calibrate
import { readFile } from 'node:fs/promises';
import { sql, toVector } from '../src/lib/db';
import { getEmbedder } from '../src/server/embeddings';

const TITLES: Record<string, string> = {
  hxh: 'Hunter x Hunter|2011',
  onepiece: 'One Piece|1999',
  bleach: 'Bleach|2004',
  shippuden: 'Naruto: Shippūden|2007',
  aot: 'Attack on Titan|2013',
};

const cases: { show: string; query: string; accept: number[] }[] = JSON.parse(await readFile('spike/cases.json', 'utf8'));
const embedder = await getEmbedder();
const db = sql();

const rows: { score: number; top1: boolean; top3: boolean; rank: number }[] = [];
for (const c of cases) {
  const [title, year] = TITLES[c.show].split('|');
  const [f] = await db<{ id: number }[]>`select id from franchise where title = ${title} and year = ${Number(year)}`;
  const q = toVector(await embedder.embedQuery(c.query));
  const found = await db<{ order: number; score: number }[]>`
    select global_order as "order", 1 - (embedding <=> ${q}::vector) as score from episode
    where franchise_id = ${f.id} and embedding_model = ${embedder.id}
    order by embedding <=> ${q}::vector limit 10`;
  const rank = found.findIndex((r) => c.accept.includes(r.order)) + 1 || Infinity;
  rows.push({ score: found[0].score, top1: rank === 1, top3: rank <= 3, rank });
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}% (${n}/${d})` : 'n/a');
console.log(`top1 ${pct(rows.filter((r) => r.top1).length, rows.length)}, top3 ${pct(rows.filter((r) => r.top3).length, rows.length)}`);
console.log('\nbest-match similarity vs. whether the best match was right:');
for (const cut of [0.6, 0.62, 0.64, 0.66, 0.68, 0.7, 0.72, 0.74]) {
  const above = rows.filter((r) => r.score >= cut);
  console.log(`  score >= ${cut}: ${above.length} scenes, best match correct ${pct(above.filter((r) => r.top1).length, above.length)}, in top 3 ${pct(above.filter((r) => r.top3).length, above.length)}`);
}
await db.end();
