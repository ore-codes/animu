'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { api, type ShowHit } from '@/lib/api';

const NUDGES = ['A character I met', 'A big fight', 'An arc name'];

function statusChip(s: ShowHit) {
  if (s.status === 'ready') return <span className="chip chip-asagi">Ready{s.episodeCount ? ` · ${s.episodeCount} episodes` : ''}</span>;
  if (s.status === 'preparing') return <span className="chip chip-kinari">Being read now</span>;
  return <span className="chip chip-kinari">Needs about a minute</span>;
}

export function Finder() {
  const router = useRouter();
  const params = useSearchParams();
  const ids = { show: useId(), memory: useId(), err: useId() };

  const [text, setText] = useState('');
  const [hits, setHits] = useState<ShowHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [picked, setPicked] = useState<ShowHit | null>(null);
  const [memory, setMemory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const memoryRef = useRef<HTMLTextAreaElement>(null);

  // "Move bookmark" links here with the show already chosen.
  useEffect(() => {
    const id = Number(params.get('show'));
    const title = params.get('title');
    if (id && title) setPicked({ tvmazeId: id, title, year: null, status: 'ready', episodeCount: null });
  }, [params]);

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      setHits(null);
      setSearchError(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setSearching(true);
      setSearchError(false);
      api
        .searchShows(q, ctrl.signal)
        .then(setHits)
        .catch((e) => e.name !== 'AbortError' && setSearchError(true))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [text]);

  function choose(show: ShowHit) {
    setPicked(show);
    setText('');
    setHits(null);
    setError(null);
    setTimeout(() => memoryRef.current?.focus(), 0);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) return setError('Pick a show first.');
    const q = memory.trim();
    if (q.length < 3) return setError('Tell us a little about what you remember.');
    setError(null);
    const query = encodeURIComponent(q);
    if (picked.status === 'ready') router.push(`/result/${picked.tvmazeId}?q=${query}`);
    else router.push(`/prepare/${picked.tvmazeId}?q=${query}&title=${encodeURIComponent(picked.title)}`);
  }

  return (
    <form className="panel panel-pop finder" onSubmit={submit} noValidate>
      <div>
        <label className="field-label" htmlFor={ids.show}>
          <span className="step-dot">1</span>Which show?
        </label>
        {picked ? (
          <div className="picked">
            <span className="title">
              {picked.title}
              {picked.year ? <span className="muted" style={{ fontWeight: 400 }}> ({picked.year})</span> : null}
            </span>
            <button type="button" className="btn btn-small" onClick={() => setPicked(null)} style={{ marginLeft: 'auto' }}>
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              id={ids.show}
              className="input"
              type="search"
              autoComplete="off"
              placeholder="Start typing, like Hunter x Hunter"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-describedby={error && !picked ? ids.err : undefined}
            />
            <div aria-live="polite">
              {searching && <p className="hint">Looking…</p>}
              {searchError && <p className="field-error">We couldn’t search just now. Try again in a moment.</p>}
            </div>
            {hits && hits.length === 0 && !searching && (
              <div className="notice" style={{ marginTop: 10, background: 'var(--sakura)' }} role="status">
                <span className="chip chip-sakura">
                  <span className="note">あれ？</span> Not found
                </span>
                <span>
                  We don’t have a show called “{text.trim()}”. Check the spelling, or try the original Japanese title.
                </span>
              </div>
            )}
            {hits && hits.length > 0 && (
              <ul className="results">
                {hits.map((s) => (
                  <li key={s.tvmazeId}>
                    <button type="button" className="result-btn" onClick={() => choose(s)}>
                      <span>
                        {s.title} {s.year && <span className="muted">({s.year})</span>}
                      </span>
                      {statusChip(s)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div>
        <label className="field-label" htmlFor={ids.memory}>
          <span className="step-dot">2</span>What do you remember?
        </label>
        <textarea
          id={ids.memory}
          ref={memoryRef}
          className="input"
          rows={3}
          maxLength={300}
          placeholder="Killua meets a woman who looks like a doll and she starts training them…"
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <span className="note muted" style={{ fontSize: 15 }}>
            Need a nudge?
          </span>
          {NUDGES.map((n) => (
            <button
              key={n}
              type="button"
              className="nudge"
              onClick={() => {
                setMemory((m) => (m ? m : `${n}: `));
                memoryRef.current?.focus();
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        {error && (
          <p id={ids.err} className="field-error" role="alert" style={{ marginTop: 0, marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div className="finder-actions">
          <button type="submit" className="btn btn-primary">
            Find my episode
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <span className="small">
            <span className="note" style={{ color: 'var(--asagi)' }}>
              ネタバレなし
            </span>{' '}
            · nothing past your match is ever shown
          </span>
        </div>
      </div>
    </form>
  );
}
