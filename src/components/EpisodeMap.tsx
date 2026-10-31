'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type EpisodeMapData } from '@/lib/api';

/** Each tick needs about this many pixels, gap included, to stay readable. */
const TICK_PX = 5;

type Tick = { state: 'watched' | 'here' | 'ahead'; marked: boolean };

function buildTicks(map: EpisodeMapData, at: number | null, maxTicks: number): Tick[] {
  const size = Math.max(1, Math.ceil(map.total / maxTicks));
  const count = Math.ceil(map.total / size);
  const marked = new Set(map.marks.map((m) => m.order));
  return Array.from({ length: count }, (_, i) => {
    const from = i * size + 1;
    const to = Math.min((i + 1) * size, map.total);
    let marks = 0;
    for (let o = from; o <= to; o++) if (marked.has(o)) marks++;
    const state = at == null ? 'ahead' : at >= from && at <= to ? 'here' : to < at ? 'watched' : 'ahead';
    return { state, marked: marks * 2 >= to - from + 1 };
  });
}

/**
 * Every episode of a show in order, drawn from the real data. With `at`, everything before it counts
 * as watched and that spot is marked. Orange ticks are recap or filler episodes.
 */
export function EpisodeMap({ tvmazeId, title, at = null, atLabel = 'You are here' }: { tvmazeId: number; title: string; at?: number | null; atLabel?: string }) {
  const [map, setMap] = useState<EpisodeMapData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setMap(null);
    setFailed(false);
    api
      .map(tvmazeId)
      .then((m) => live && setMap(m))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [tvmazeId]);

  const stripRef = useRef<HTMLDivElement>(null);
  const [maxTicks, setMaxTicks] = useState(120);

  // Long shows are grouped so the strip stays legible at any width.
  const hasMap = Boolean(map);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => setMaxTicks(Math.max(30, Math.floor(el.clientWidth / TICK_PX)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasMap]);

  const ticks = useMemo(() => (map ? buildTicks(map, at, maxTicks) : []), [map, at, maxTicks]);

  if (failed || (map && map.total === 0)) return null;
  if (!map) return <div className="strip-section" style={{ minHeight: 120 }} aria-busy="true" />;

  const here = at != null && at <= map.total ? at : null;
  const pos = here ? Math.min(Math.max(((here - 0.5) / map.total) * 100, 12), 88) : 0;
  const extras = map.marks.length;

  return (
    <section className="strip-section" aria-label={`${title}: every episode in order`}>
      <div className="strip-legend">
        <span style={{ fontWeight: 700, color: 'var(--sumi)' }}>{title}, every episode in order</span>
        <span>
          {here && (
            <>
              <b style={{ color: 'var(--asagi)' }}>Watched</b> · <b style={{ color: 'var(--kaki)' }}>{atLabel}</b>
              {extras > 0 && ' · '}
            </>
          )}
          {extras > 0 && <b style={{ color: '#8a6200' }}>Recap or filler</b>}
        </span>
      </div>
      <div
        ref={stripRef}
        className="strip"
        role="img"
        aria-label={`${map.total} episodes in order.${here ? ` ${atLabel}: episode ${here}.` : ''}${extras ? ` ${extras} are recap or filler.` : ''}`}
      >
        {ticks.map((t, i) => (
          <i key={i} className={`tick tick-${t.state}${t.marked ? ' tick-marked' : ''}`} />
        ))}
      </div>
      <div className="strip-axis" aria-hidden="true">
        <span className="strip-end" style={{ left: 0 }}>
          1
        </span>
        {here && (
          <span className="note strip-here" style={{ left: `${pos}%` }}>
            ここだ！ Episode {here}
          </span>
        )}
        <span className="strip-end" style={{ right: 0 }}>
          {map.total}
        </span>
      </div>
    </section>
  );
}
