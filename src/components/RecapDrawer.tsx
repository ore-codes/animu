'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, type Recap } from '@/lib/api';

type Props = { tvmazeId: number; title: string; upTo: number; onClose: () => void };

export function RecapDrawer({ tvmazeId, title, upTo, onClose }: Props) {
  const [count, setCount] = useState(3);
  const [recaps, setRecaps] = useState<Recap[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    setRecaps(null);
    setError(null);
    api
      .recaps(tvmazeId, upTo, count)
      .then((r) => live && setRecaps(r))
      .catch((e: ApiError) => live && setError(e.status === 429 ? 'Lots of people are reading recaps right now. Try again in a minute.' : 'We couldn’t load the recap. Try again.'));
    return () => {
      live = false;
    };
  }, [tvmazeId, upTo, count]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const first = recaps?.[0]?.order;
  const last = recaps?.[recaps.length - 1]?.order;

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="recap-title">
        <div className="drawer-head">
          <div>
            <div className="note" style={{ fontSize: 18, color: 'var(--kaki)' }}>
              前回までのあらすじ
            </div>
            <h2 id="recap-title" className="display">
              Previously on…
            </h2>
            <div className="muted" style={{ fontSize: 14, marginTop: 8 }}>
              {title}
              {first != null && ` · episodes ${first}${last !== first ? ` to ${last}` : ''}`}
            </div>
          </div>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close recap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <div className="stamp" style={{ alignItems: 'center' }}>
          <span className="stamp-tag note">ネタバレなし</span>
          <span>Written only from what happened before episode {upTo}.</span>
        </div>

        {error && <p className="field-error">{error}</p>}

        {!recaps && !error && (
          <div aria-live="polite" style={{ display: 'grid', gap: 12 }}>
            <span className="sr-only">Loading recap</span>
            <div className="skel" />
            <div className="skel" style={{ width: '80%' }} />
            <div className="skel" style={{ width: '90%' }} />
          </div>
        )}

        {recaps && recaps.length === 0 && <p className="muted">Nothing comes before this episode, so there is nothing to recap.</p>}

        {recaps && recaps.length > 0 && (
          <ol className="recap-list">
            {recaps.map((r) => (
              <li key={r.order} className="recap-item">
                <header>
                  <span className="no display">第{r.order}話</span>
                  {r.kind === 'recap' ? <span className="chip chip-kinari">Recap episode</span> : <span className="chip chip-asagi">Episode</span>}
                </header>
                <p>{r.recap}</p>
              </li>
            ))}
          </ol>
        )}

        <div className="drawer-foot">
          <button className="btn btn-primary" style={{ fontSize: 17 }} onClick={onClose}>
            Done
          </button>
          {count === 3 && upTo > 4 && (
            <button className="btn" onClick={() => setCount(5)}>
              Go back 5 instead
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
