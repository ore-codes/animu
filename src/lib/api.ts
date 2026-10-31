import type { FindResult } from '@/server/search/find';

export type ShowHit = {
  tvmazeId: number;
  title: string;
  year: number | null;
  status: 'missing' | 'preparing' | 'ready' | 'failed';
  episodeCount: number | null;
};

export type ShowStatus = {
  tvmazeId: number;
  title: string;
  year: number | null;
  status: ShowHit['status'];
  episodeCount: number;
  progress: { step: string; percent: number; failed: boolean; reason: 'no_synopses' | 'error' | null } | null;
};

export type Recap = { order: number; title: string; kind: string; recap: string; source: 'ai' | 'synopsis' };
export type EpisodeMapData = { total: number; marks: { order: number; kind: string }[] };
export type Upcoming = { order: number; kind: string; title?: string };

/** A failed call. `status` lets screens choose a calm message instead of showing raw text. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(0, 'offline');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string }).error ?? 'Request failed');
  return body as T;
}

const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  searchShows: (q: string, signal?: AbortSignal) =>
    request<{ shows: ShowHit[] }>(`/api/shows/search?q=${encodeURIComponent(q)}`, { signal }).then((r) => r.shows),
  prepare: (id: number) => request<{ status: string }>(`/api/shows/${id}/prepare`, { method: 'POST' }),
  status: (id: number) => request<ShowStatus>(`/api/shows/${id}`),
  find: (tvmazeId: number, query: string) => request<FindResult>('/api/find', post({ tvmazeId, query })),
  recaps: (id: number, upTo: number, count: number) =>
    request<{ recaps: Recap[] }>(`/api/shows/${id}/recap?upTo=${upTo}&count=${count}`).then((r) => r.recaps),
  map: (id: number) => request<EpisodeMapData>(`/api/shows/${id}/map`),
  upcoming: (id: number, after: number, reveal: boolean) =>
    request<{ upcoming: Upcoming[] }>(`/api/shows/${id}/upcoming?after=${after}&reveal=${reveal ? 1 : 0}`).then((r) => r.upcoming),
};
