// Spike: build one episode corpus per show from TVmaze and Kitsu, keeping whichever has more usable synopses.
// Run: node spike/ingest.mjs
import { mkdir, writeFile } from 'node:fs/promises';

const SHOWS = [
  { slug: 'hxh', name: 'Hunter x Hunter (2011)', mal: 11061, tvmaze: { q: 'hunter x hunter', year: 2011 } },
  { slug: 'onepiece', name: 'One Piece', mal: 21, tvmaze: { id: 1505 } },
  { slug: 'bleach', name: 'Bleach', mal: 269, tvmaze: { q: 'bleach', year: 2004 } },
  { slug: 'shippuden', name: 'Naruto Shippuden', mal: 1735, tvmaze: { q: 'naruto shippuden', year: 2007 } },
  { slug: 'aot', name: 'Attack on Titan', mal: 16498, tvmaze: { q: 'attack on titan', year: 2013 } },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const usable = (s) => s.length >= 60;

async function getJson(url, headers = {}) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers });
    if (res.status === 429) { await sleep(1500 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }
  throw new Error(`rate limited ${url}`);
}

async function tvmazeEpisodes(spec) {
  let id = spec.id;
  if (!id) {
    const hits = await getJson(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(spec.q)}`);
    const hit = hits.find((h) => h.show.language === 'Japanese' && h.show.premiered?.startsWith(String(spec.year)));
    if (!hit) return [];
    id = hit.show.id;
  }
  const eps = await getJson(`https://api.tvmaze.com/shows/${id}/episodes`);
  return eps
    .filter((e) => e.type === 'regular')
    .sort((a, b) => (a.airstamp || '').localeCompare(b.airstamp || ''))
    .map((e, i) => ({ order: i + 1, title: e.name, synopsis: strip(e.summary), source: 'tvmaze', season: e.season }));
}

async function kitsuEpisodes(mal) {
  const hdr = { Accept: 'application/vnd.api+json' };
  const map = await getJson(`https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${mal}`, hdr);
  if (!map.data?.length) return [];
  const item = await getJson(`https://kitsu.io/api/edge/mappings/${map.data[0].id}/item`, hdr);
  let url = `https://kitsu.io/api/edge/anime/${item.data.id}/episodes?page[limit]=20&sort=number`;
  const out = [];
  while (url) {
    const page = await getJson(url, hdr);
    for (const e of page.data) {
      out.push({
        order: e.attributes.number,
        title: e.attributes.canonicalTitle || '',
        synopsis: strip(e.attributes.synopsis || e.attributes.description),
        source: 'kitsu',
      });
    }
    url = page.links?.next ?? null;
    await sleep(150);
  }
  return out;
}

await mkdir(new URL('./data/', import.meta.url), { recursive: true });

for (const show of SHOWS) {
  const [tv, ki] = await Promise.all([tvmazeEpisodes(show.tvmaze).catch(() => []), kitsuEpisodes(show.mal).catch(() => [])]);
  const score = (eps) => eps.filter((e) => usable(e.synopsis)).length;
  const chosen = score(tv) >= score(ki) ? tv : ki;
  const episodes = chosen.filter((e) => usable(e.synopsis));
  await writeFile(new URL(`./data/${show.slug}.json`, import.meta.url), JSON.stringify({ show: show.name, source: chosen[0]?.source, episodes }, null, 1));
  console.log(`${show.name}: tvmaze=${score(tv)}/${tv.length} kitsu=${score(ki)}/${ki.length} -> using ${chosen[0]?.source}, ${episodes.length} episodes kept`);
}
