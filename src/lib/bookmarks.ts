'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type Bookmark = { tvmazeId: number; title: string; order: number; savedAt: string };

const KEY = 'animu:bookmarks';
const listeners = new Set<() => void>();
let snapshot: Bookmark[] | null = null;
const EMPTY: Bookmark[] = [];

function read(): Bookmark[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((b) => b && Number.isInteger(b.tvmazeId) && Number.isInteger(b.order)) : [];
  } catch {
    return [];
  }
}

function write(next: Bookmark[]) {
  snapshot = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: the bookmark still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      snapshot = null;
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

const getSnapshot = () => (snapshot ??= read());
const getServerSnapshot = () => EMPTY;

export function useBookmarks() {
  const bookmarks = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((b: Omit<Bookmark, 'savedAt'>) => {
    const rest = getSnapshot().filter((x) => x.tvmazeId !== b.tvmazeId);
    write([{ ...b, savedAt: new Date().toISOString() }, ...rest].slice(0, 30));
  }, []);

  const remove = useCallback((tvmazeId: number) => write(getSnapshot().filter((x) => x.tvmazeId !== tvmazeId)), []);

  return { bookmarks, save, remove };
}

export function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
