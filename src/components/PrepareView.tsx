'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError, type ShowStatus } from '@/lib/api';

const STEPS = [
  { key: 'sources', title: 'Collecting episodes' },
  { key: 'embedding', title: 'Reading every synopsis' },
  { key: 'saving', title: 'Building the search index' },
];

type Problem = 'busy' | 'not_anime' | 'no_synopses' | 'failed' | 'offline';

const PROBLEMS: Record<Problem, { title: string; body: string }> = {
  busy: { title: 'A lot of shows at once', body: 'Many shows have been started from this connection lately. Wait a few minutes and try again.' },
  not_anime: { title: 'We can’t read that one', body: 'That doesn’t look like an anime we know how to prepare.' },
  no_synopses: { title: 'No episode descriptions yet', body: 'The sources we use don’t have written descriptions for this show, so there is nothing to search. Another series of the same name may work.' },
  failed: { title: 'That didn’t finish', body: 'Something went wrong while reading this show. Trying again usually fixes it.' },
  offline: { title: 'Can’t reach Animu', body: 'Check your connection and try again.' },
};

export function PrepareView({ tvmazeId, title, query }: { tvmazeId: number; title: string; query: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ShowStatus | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    setProblem(null);
    started.current = Date.now();

    const done = () => router.replace(query ? `/result/${tvmazeId}?q=${encodeURIComponent(query)}` : '/');

    const poll = async () => {
      try {
        const s = await api.status(tvmazeId);
        if (!live) return;
        setStatus(s);
        if (s.status === 'ready') return done();
        if (s.status === 'failed' || s.progress?.failed) return setProblem(s.progress?.reason === 'no_synopses' ? 'no_synopses' : 'failed');
        timer = setTimeout(poll, 2000);
      } catch {
        if (live) timer = setTimeout(poll, 4000);
      }
    };

    api
      .prepare(tvmazeId)
      .then((r) => (r.status === 'ready' ? done() : poll()))
      .catch((e: ApiError) => live && setProblem(e.status === 429 ? 'busy' : e.status === 404 ? 'not_anime' : e.status === 0 ? 'offline' : 'failed'));

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [tvmazeId, query, router, attempt]);

  const step = status?.progress?.step ?? 'sources';
  const activeIndex = Math.max(0, STEPS.findIndex((s) => s.key === step));
  const percent = status?.progress?.percent ?? 0;
  const name = status?.title ?? title;

  if (problem) {
    const p = PROBLEMS[problem];
    return (
      <main className="narrow">
        <div className="panel state panel-pop" role="alert">
          <h2 className="display">{p.title}</h2>
          <p>{p.body}</p>
          <div className="actions">
            {problem !== 'no_synopses' && problem !== 'not_anime' && (
              <button className="btn btn-primary" style={{ fontSize: 17 }} onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </button>
            )}
            <Link className="btn" href="/">
              Pick another show
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="narrow">
      <p className="note" style={{ margin: '0 0 12px', fontSize: 20, color: 'var(--kaki)' }}>
        ちょっと待ってね
      </p>
      <h1 className="display">
        Shelving <span className="mark">{name}</span> for the first time
      </h1>
      <p className="lede" style={{ maxWidth: 'none', marginTop: 22, fontSize: 18 }}>
        We read every episode once so later searches are instant. It usually takes about a minute. Keep this tab open and we’ll carry on by ourselves.
      </p>

      <ol className="panel panel-pop steps" aria-label="Progress" aria-live="polite">
        {STEPS.map((s, i) => {
          const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'wait';
          return (
            <li key={s.key} className="step">
              <div className={`step-no ${state}`} aria-hidden="true">
                {state === 'done' ? '✓' : i + 1}
              </div>
              <div className="step-body">
                <div className={`step-title ${state === 'wait' ? 'wait' : ''}`}>
                  <span>{s.title}</span>
                  <small>{state === 'done' ? 'Done' : state === 'active' ? 'In progress' : 'Waiting'}</small>
                </div>
                {state === 'active' && (
                  <div className="bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={s.title}>
                    <div style={{ width: `${Math.max(6, percent)}%` }} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 28 }}>
        <span className="note muted" style={{ fontSize: 16 }}>
          In a hurry?
        </span>
        <Link className="btn btn-small" href="/" style={{ background: 'var(--page)' }}>
          Go back, I’ll return later
        </Link>
      </div>
    </main>
  );
}
