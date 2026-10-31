'use client';

import Link from 'next/link';
import { useState } from 'react';
import { timeAgo, useBookmarks, type Bookmark } from '@/lib/bookmarks';
import { RecapDrawer } from './RecapDrawer';

const TONES = ['var(--kaki)', 'var(--asagi)', 'var(--yamabuki)'];

export function Bookmarks() {
  const { bookmarks, remove } = useBookmarks();
  const [recapFor, setRecapFor] = useState<Bookmark | null>(null);

  return (
    <section id="bookmarks" className="wrap section" aria-labelledby="bookmarks-title">
      <div className="section-head">
        <h2 id="bookmarks-title" className="display">
          My bookmarks <span className="note" style={{ fontSize: 20, color: 'var(--kaki)' }}>しおり</span>
        </h2>
        <span className="muted" style={{ fontSize: 14 }}>
          Saved in this browser only
        </span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="panel empty">
          <div className="display" style={{ fontSize: 24 }}>
            No bookmarks yet
          </div>
          <p>Find an episode and press “Bookmark this spot”. It shows up here so you can pick up again.</p>
        </div>
      ) : (
        <div className="card-grid">
          {bookmarks.map((b, i) => (
            <article key={b.tvmazeId} className="panel bookmark">
              <div className="bookmark-head">
                <div className="avatar" style={{ background: TONES[i % 3], color: i % 3 === 2 ? 'var(--sumi)' : 'var(--page)' }} aria-hidden="true">
                  {b.title.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{b.title}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Saved {timeAgo(b.savedAt)}
                  </div>
                </div>
              </div>
              <div className="bookmark-at">
                <span className="note muted" style={{ fontSize: 15 }}>
                  You are at
                </span>
                <span className="display" style={{ fontSize: 26 }}>
                  第{b.order}話
                </span>
              </div>
              <div className="bookmark-actions">
                <button className="btn btn-soft btn-small" onClick={() => setRecapFor(b)}>
                  Previously on
                </button>
                <Link className="btn btn-small" href={`/?show=${b.tvmazeId}&title=${encodeURIComponent(b.title)}#find`}>
                  Move bookmark
                </Link>
                <button className="btn btn-quiet btn-small" onClick={() => remove(b.tvmazeId)} aria-label={`Remove bookmark for ${b.title}`}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {recapFor && <RecapDrawer tvmazeId={recapFor.tvmazeId} title={recapFor.title} upTo={recapFor.order} onClose={() => setRecapFor(null)} />}
    </section>
  );
}
