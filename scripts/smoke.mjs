// Live check for animu.net. Runs in CI on a schedule and fails loudly when the site or its AI is unhealthy.
// Usage: node scripts/smoke.mjs [origin]   (default https://www.animu.net)
const ORIGIN = (process.argv[2] ?? 'https://www.animu.net').replace(/\/$/, '');
const HUNTER_X_HUNTER = 1536;

const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ''}`);
};

async function call(path, init) {
  const res = await fetch(`${ORIGIN}${path}`, { ...init, signal: AbortSignal.timeout(45_000) });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    // Not JSON: the status check below reports it.
  }
  return { status: res.status, body, text };
}

// One retry, so a single cold start or network blip does not raise an alarm.
async function attempt(name, fn) {
  for (let i = 1; i <= 2; i++) {
    try {
      const result = await fn();
      if (result.ok || i === 2) return check(name, result.ok, result.detail);
    } catch (err) {
      if (i === 2) return check(name, false, String(err?.message ?? err));
    }
    await new Promise((r) => setTimeout(r, 20_000));
  }
}

await attempt('home page loads', async () => {
  const { status, text } = await call('/');
  return { ok: status === 200 && text.includes('Animu'), detail: `status ${status}` };
});

await attempt('show search finds Hunter x Hunter, ready', async () => {
  const { status, body } = await call('/api/shows/search?q=hunter%20x%20hunter');
  const hit = body?.shows?.find((s) => s.tvmazeId === HUNTER_X_HUNTER);
  return { ok: status === 200 && hit?.status === 'ready' && hit.episodeCount > 100, detail: `status ${status}, show ${hit?.status ?? 'missing'}` };
});

await attempt('episode map has episodes', async () => {
  const { status, body } = await call(`/api/shows/${HUNTER_X_HUNTER}/map`);
  return { ok: status === 200 && body?.total > 100, detail: `status ${status}, total ${body?.total}` };
});

await attempt('recap returns text', async () => {
  const { status, body } = await call(`/api/shows/${HUNTER_X_HUNTER}/recap?upTo=10&count=1`);
  const recap = body?.recaps?.[0]?.recap;
  return { ok: status === 200 && typeof recap === 'string' && recap.length > 40, detail: `status ${status}` };
});

// A different query every day, because results are cached and a cached answer would hide a broken AI.
await attempt('find answers with AI ranking', async () => {
  const day = new Date().toISOString().slice(0, 10);
  const { status, body } = await call('/api/find', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ tvmazeId: HUNTER_X_HUNTER, query: `Gon fights Hisoka at Heavens Arena, checked ${day}` }),
  });
  const best = body?.matches?.[0];
  const ok = status === 200 && body?.mode === 'ai' && Boolean(best?.reason) && Boolean(best?.confidence);
  const why = body?.notice ? `, notice ${body.notice}` : '';
  return { ok, detail: `status ${status}, mode ${body?.mode}${why}` };
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed against ${ORIGIN}`);
  process.exit(1);
}
console.log(`\nAll checks passed against ${ORIGIN}`);
