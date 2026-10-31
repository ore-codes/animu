// Spike: how many episodes per show have a usable synopsis in Kitsu?
// Run: node spike/coverage.mjs
const SHOWS = [
  { name: 'Hunter x Hunter (2011)', mal: 11061 },
  { name: 'One Piece', mal: 21 },
  { name: 'Bleach', mal: 269 },
  { name: 'Naruto Shippuden', mal: 1735 },
  { name: 'Attack on Titan', mal: 16498 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.api+json' } });
    if (res.status === 429) { await sleep(1500 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }
  throw new Error(`rate limited ${url}`);
}

async function kitsuEpisodes(mal) {
  const map = await getJson(
    `https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${mal}`,
  );
  if (!map.data?.length) return { kitsuId: null, eps: [] };
  const item = await getJson(`https://kitsu.io/api/edge/mappings/${map.data[0].id}/item`);
  const kitsuId = item.data.id;
  let url = `https://kitsu.io/api/edge/anime/${kitsuId}/episodes?page[limit]=20&sort=number`;
  const eps = [];
  while (url) {
    const page = await getJson(url);
    eps.push(...page.data);
    url = page.links?.next ?? null;
    await sleep(150);
  }
  return { kitsuId, eps };
}

for (const show of SHOWS) {
  try {
    const { kitsuId, eps } = await kitsuEpisodes(show.mal);
    const synopses = eps.map((e) => e.attributes.synopsis || e.attributes.description || '');
    const usable = synopses.filter((s) => s.trim().length >= 60).length;
    const avg = synopses.length
      ? Math.round(synopses.reduce((n, s) => n + s.length, 0) / synopses.length)
      : 0;
    console.log(
      `${show.name}: kitsu=${kitsuId} episodes=${eps.length} usable(>=60ch)=${usable} (${
        eps.length ? Math.round((usable / eps.length) * 100) : 0
      }%) avgLen=${avg}`,
    );
  } catch (err) {
    console.log(`${show.name}: FAILED ${err.message}`);
  }
}
