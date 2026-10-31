'use client';

import { useBookmarks } from '@/lib/bookmarks';
import { Ribbon } from './Logo';

/** Shows the episode of your most recent bookmark, or a question mark until you have one. */
export function HeroRibbon() {
  const { bookmarks } = useBookmarks();
  return <Ribbon order={bookmarks[0]?.order ?? null} />;
}
