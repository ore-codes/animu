'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FindResult } from '@/server/search/find';
import { api, ApiError, type Upcoming } from '@/lib/api';
import { useBookmarks } from '@/lib/bookmarks';
import { EpisodeMap } from './EpisodeMap';
import { BookmarkIcon, Ribbon } from './Logo';
import { RecapDrawer } from './RecapDrawer';

type Load =
  | { phase: 'loading' }
  | { phase: 'error'; kind: 'busy' | 'offline' | 'other' }
  | { phase: 'ready'; title: string; year: number | null; result: FindResult };

const PIPS = { high: 3, medium: 2, low: 1 } as const;
const CONF_LABEL = { high: 'Very likely', medium: 'Possible', low: 'Long shot' } as const;

export function ResultView({ tvmazeId, query }: { tvmazeId: number; query: string }) {
  const router = useRouter();
  const { bookmarks, save } = useBookmarks();
  const [load, setLoad] = useState<Load>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [recapOpen, setRecapOpen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);

  useEffect(() => {
    let live = true;
    setLoad({ phase: 'loading' });
    setSkipped(0);
    setReveal(false);
    Promise.all([api.status(tvmazeId), api.find(tvmazeId, query)])
      .then(([show, result]) => live && setLoad({ phase: 'ready', title: show.title, year: show.year, result }))
      .catch((e: ApiError) => {
        if (!live) return;
        if (e.status === 404 || e.status === 409) return router.replace(`/prepare/${tvmazeId}?q=${encodeURIComponent(query)}`);
        setLoad({ phase: 'error', kind: e.status === 429 ? 'busy' : e.status === 0 ? 'offline' : 'other' });
      });
    return () => {
      live = false;
    };
  }, [tvmazeId, query, attempt, router]);

  const ready = load.phase === 'ready' ? load : null;
  const matches = ready?.result.matches ?? [];
  const best = matches[skipped];
  const bestOrder = best?.order;

  useEffect(() => {
    if (!ready || bestOrder == null) return;
    if (skipped === 0 && !reveal) return setUpcoming(ready.result.upcoming);
    let live = true;
    api
      .upcoming(tvmazeId, bestOrder, reveal)
      .then((u) => live && setUpcoming(u))
      .catch(() => live && setUpcoming([]));
    return () => {
      live = false;
    };
  }, [ready, bestOrder, skipped, reveal, tvmazeId]);

  const title = ready?.title ?? '';
  const findAgain = `/?show=${tvmazeId}&title=${encodeURIComponent(title)}#find`;

  if (load.phase === 'loading') {
    return (
      <main className="wrap-wide" style={{ paddingTop: 32, paddingBottom: 64 }} aria-busy="true">
        <p className="note" style={{ fontSize: 20, color: 'var(--kaki)' }}>
          さがしています…
        </p>
        <div className="panel state" role="status">
          <h2 className="display">Searching every episode</h2>
          <div className="skel" />
          <div className="skel" style={{ width: '85%' }} />
          <div className="skel" style={{ width: '60%' }} />
        </div>
      </main>
    );
  }

  if (load.phase === 'error') {
    const msg = {
      busy: { t: 'You’re searching fast', b: 'Give it a minute and try again.' },
      offline: { t: 'Can’t reach Animu', b: 'Check your connection and try again.' },
      other: { t: 'Something went wrong on our side', b: 'Your search wasn’t lost. Trying again usually works.' },
    }[load.kind];
    return (
      <main className="wrap-wide" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="panel panel-pop state" role="alert">
          <h2 className="display">{msg.t}</h2>
          <p>{msg.b}</p>
          <div className="actions">
            <button className="btn btn-primary" style={{ fontSize: 17 }} onClick={() => setAttempt((a) => a + 1)}>
              Try again
            </button>
            <Link className="btn" href="/">
              Back to start
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { result } = load;
  const saved = best && bookmarks.find((b) => b.tvmazeId === tvmazeId)?.order === best.order;
  const confident = result.mode === 'ai' && best?.confidence === 'high';

  return (
    <main className="wrap-wide" style={{ paddingBottom: 64 }}>
      <div className="panel querybar">
        <span className="chip chip-kinari" style={{ fontSize: 14, border: '1.5px solid var(--sumi)', borderRadius: 6, padding: '5px 12px' }}>
          {title}
          {load.year ? ` (${load.year})` : ''}
        </span>
        <span className="q">“{query}”</span>
        <Link href={findAgain} style={{ fontSize: 14, fontWeight: 700 }}>
          Edit search
        </Link>
      </div>

      {result.notice && (
        <div className="notice" role="status" style={{ marginBottom: 24 }}>
          <span className="chip chip-kinari">
            <span className="note">ちょっと休憩</span> {result.notice === 'ai_budget' ? 'Busy today' : 'Resting'}
          </span>
          <span>
            {result.notice === 'ai_budget'
              ? 'We hit today’s limit for the smarter ranking, so these results use meaning search only. Read each description before you trust it.'
              : 'The smarter ranking didn’t answer, so these results use meaning search only. Read each description before you trust it.'}
          </span>
        </div>
      )}

      <div className="result-cols">
        <div className="result-main">
          {!best ? (
            <div className="panel panel-pop state">
              <span className="chip chip-kinari" style={{ alignSelf: 'flex-start' }}>
                <span className="note">うーん</span> Not sure yet
              </span>
              <h2 className="display">We’re not sure yet</h2>
              <p>Nothing else fits well enough to suggest. Adding a character’s name, or what happened just before, usually narrows it down.</p>
              <div className="actions">
                <Link className="btn btn-primary" style={{ fontSize: 17 }} href={findAgain}>
                  Add more detail
                </Link>
                <button className="btn" onClick={() => setSkipped(0)}>
                  See the closest again
                </button>
              </div>
            </div>
          ) : (
            <>
              <article className="panel panel-pop best" aria-labelledby="best-title">
                {confident && <div className="bubble note">ここだ！</div>}

                <div className="best-head">
                  <Ribbon order={best.order} small />
                  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <div className="eyebrow">
                      {title} · {confident ? 'Best match' : skipped > 0 ? 'Next closest' : 'Closest match'}
                    </div>
                    <h1 id="best-title" className="display">
                      Episode {best.order}
                    </h1>
                    <div className="best-title">{best.title}</div>
                  </div>
                </div>

                {best.confidence && (
                  <div className="conf">
                    <span>How sure we are</span>
                    <span className="conf-meter" aria-hidden="true">
                      {[1, 2, 3].map((n) => (
                        <i key={n} className={n <= PIPS[best.confidence!] ? 'on' : ''} />
                      ))}
                    </span>
                    <span style={{ color: 'var(--asagi)' }}>{CONF_LABEL[best.confidence]}</span>
                  </div>
                )}

                <p className="best-synopsis">{best.synopsis}</p>

                <div className="dashed reason">
                  <b className="note">{best.reason ? 'Why we think so' : 'Is this the one?'}</b>
                  <p>
                    {best.reason ??
                      'We matched what you wrote to this episode’s description. If it doesn’t ring a bell, try “Not this one”.'}
                  </p>
                </div>

                <div className="actions">
                  {saved ? (
                    <span className="saved-note" role="status">
                      ✓ Bookmarked.{' '}
                      <Link href="/#bookmarks">See my bookmarks</Link>
                    </span>
                  ) : (
                    <button className="btn btn-primary" onClick={() => save({ tvmazeId, title, order: best.order })}>
                      <BookmarkIcon size={16} fill="var(--page)" />
                      Bookmark this spot
                    </button>
                  )}
                  <button className="btn btn-soft" onClick={() => setRecapOpen(true)}>
                    Previously on…
                  </button>
                  {skipped + 1 < matches.length ? (
                    <button className="btn btn-quiet" onClick={() => setSkipped((s) => s + 1)}>
                      Not this one
                    </button>
                  ) : (
                    <Link className="btn btn-quiet" href={findAgain}>
                      None of these
                    </Link>
                  )}
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Episode numbers count every season in airing order.
                </div>
              </article>

              <EpisodeMap tvmazeId={tvmazeId} title={title} at={best.order} atLabel="Your match" />

              {matches.length > 1 && (
                <section className="others" aria-labelledby="others-title">
                  <h2 id="others-title">Could also be</h2>
                  {matches.map((m, i) =>
                    i === skipped ? null : (
                      <div key={m.order} className="panel other">
                        <div className="no display">第{m.order}話</div>
                        <div className="txt">
                          <b>{m.title}</b>
                          <span>{m.reason ?? m.synopsis.slice(0, 120) + (m.synopsis.length > 120 ? '…' : '')}</span>
                        </div>
                        <button className="btn btn-small" onClick={() => setSkipped(i)}>
                          Use this one
                        </button>
                      </div>
                    ),
                  )}
                </section>
              )}
            </>
          )}
        </div>

        <aside className="result-side">
          {best && (
            <section className="panel side-panel" aria-labelledby="up-title">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 id="up-title" style={{ margin: 0 }}>
                  次回予告 <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--muted)' }}>Coming up</span>
                </h2>
                <span className="muted" style={{ fontSize: 12 }}>
                  {reveal ? 'Titles shown' : 'Titles hidden'}
                </span>
              </div>
              {upcoming.length === 0 ? (
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                  That’s the last episode we have.
                </p>
              ) : (
                upcoming.map((u) => (
                  <div key={u.order} className="up">
                    <span className="t">{u.title ? `${u.order}. ${u.title}` : `Episode ${u.order}`}</span>
                    {u.kind === 'recap' ? <span className="chip chip-kinari">Recap</span> : u.kind === 'filler' ? <span className="chip chip-kinari">Filler</span> : null}
                  </div>
                ))
              )}
              <button className="linkish" onClick={() => setReveal((r) => !r)}>
                {reveal ? 'Hide titles' : 'Show titles'}
              </button>
            </section>
          )}

          <div className="stamp">
            <span className="stamp-tag note">ネタバレなし</span>
            <span>Nothing after {best ? `episode ${best.order}` : 'your match'} is shown unless you ask for it.</span>
          </div>
        </aside>
      </div>

      {recapOpen && best && <RecapDrawer tvmazeId={tvmazeId} title={title} upTo={best.order} onClose={() => setRecapOpen(false)} />}
    </main>
  );
}
