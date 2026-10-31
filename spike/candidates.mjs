// Prints which episodes' synopses match each anchor, so expected answers can be pinned by hand.
import { readFile } from 'node:fs/promises';

const anchors = JSON.parse(await readFile(new URL('./anchors.json', import.meta.url), 'utf8'));
const cache = {};
for (const a of anchors) {
  cache[a.show] ??= JSON.parse(await readFile(new URL(`./data/${a.show}.json`, import.meta.url), 'utf8'));
  const re = new RegExp(a.anchor, 'i');
  const hits = cache[a.show].episodes.filter((e) => re.test(e.title + ' ' + e.synopsis));
  console.log(`\n[${a.id}] ${a.show} /${a.anchor}/ -> ${hits.length} hits`);
  for (const h of hits.slice(0, 4)) console.log(`   #${h.order} ${h.title} | ${h.synopsis.slice(0, 130)}`);
}
