// Spike: score keyword, local-embedding and hybrid search against hand-checked scenes.
// Run: node spike/search.mjs
import { readFile } from 'node:fs/promises';
import { pipeline } from '@huggingface/transformers';

const MODEL = 'Xenova/bge-small-en-v1.5';
const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';
const cases = JSON.parse(await readFile(new URL('./cases.json', import.meta.url), 'utf8'));
const shows = [...new Set(cases.map((c) => c.show))];

const extractor = await pipeline('feature-extraction', MODEL);
const embed = async (texts) => {
  const out = [];
  for (let i = 0; i < texts.length; i += 32) {
    const t = await extractor(texts.slice(i, i + 32), { pooling: 'mean', normalize: true });
    out.push(...t.tolist());
  }
  return out;
};
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

const stop = new Set('the a an and of to in on at by for with from his her their is are was who that this it as he she they them into after before while when then'.split(' '));
const tok = (s) => s.toLowerCase().match(/[a-z0-9']+/g)?.filter((w) => !stop.has(w) && w.length > 2) ?? [];

const index = {};
for (const show of shows) {
  const { episodes } = JSON.parse(await readFile(new URL(`./data/${show}.json`, import.meta.url), 'utf8'));
  const texts = episodes.map((e) => `${e.title}. ${e.synopsis}`);
  const vecs = await embed(texts);
  const df = new Map();
  const docs = texts.map((t) => { const w = tok(t); new Set(w).forEach((x) => df.set(x, (df.get(x) ?? 0) + 1)); return w; });
  index[show] = { episodes, vecs, docs, df, n: episodes.length };
  console.log(`indexed ${show}: ${episodes.length} episodes`);
}

function keywordScores(ix, query) {
  const q = tok(query);
  return ix.docs.map((d) => {
    const tf = new Map(); d.forEach((w) => tf.set(w, (tf.get(w) ?? 0) + 1));
    return q.reduce((s, w) => s + (tf.get(w) ? Math.log(1 + ix.n / (ix.df.get(w) ?? 1)) * (1 + Math.log(tf.get(w))) : 0), 0);
  });
}
const rank = (scores) => scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
const rrf = (...ranks) => {
  const s = new Map();
  ranks.forEach((r) => r.forEach((i, pos) => s.set(i, (s.get(i) ?? 0) + 1 / (60 + pos))));
  return [...s.entries()].sort((a, b) => b[1] - a[1]).map(([i]) => i);
};

const methods = { keyword: [], embedding: [], hybrid: [] };
const detail = [];
for (const c of cases) {
  const ix = index[c.show];
  const [qv] = await embed([QUERY_PREFIX + c.query]);
  const kRank = rank(keywordScores(ix, c.query));
  const eRank = rank(ix.vecs.map((v) => dot(qv, v)));
  const hRank = rrf(kRank.slice(0, 50), eRank.slice(0, 50));
  const position = (r) => { const p = r.findIndex((i) => c.accept.includes(ix.episodes[i].order)); return p < 0 ? Infinity : p + 1; };
  const row = { k: position(kRank), e: position(eRank), h: position(hRank) };
  methods.keyword.push(row.k); methods.embedding.push(row.e); methods.hybrid.push(row.h);
  detail.push(`${c.show.padEnd(9)} kw=${String(row.k).padStart(4)} emb=${String(row.e).padStart(4)} hyb=${String(row.h).padStart(4)}  ${c.query.slice(0, 62)}`);
}
console.log('\n' + detail.join('\n'));
const pct = (arr, n) => `${Math.round((arr.filter((p) => p <= n).length / arr.length) * 100)}%`;
console.log(`\n${cases.length} scenes`);
for (const [name, arr] of Object.entries(methods)) console.log(`${name.padEnd(10)} top1=${pct(arr, 1)} top3=${pct(arr, 3)} top5=${pct(arr, 5)} top10=${pct(arr, 10)}`);
