create extension if not exists vector;

create table franchise (
  id bigserial primary key,
  tvmaze_id integer not null unique,
  kitsu_id text,
  title text not null,
  year integer,
  status text not null default 'missing' check (status in ('missing', 'preparing', 'ready', 'failed')),
  episode_count integer not null default 0,
  synopsis_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- global_order is one continuous count across seasons, so numbers never reset.
-- kind: 'filler' is reserved until a filler source is added.
-- embedding is an untyped vector; embedding_model says which model made it, and queries only compare like with like.
create table episode (
  id bigserial primary key,
  franchise_id bigint not null references franchise (id) on delete cascade,
  global_order integer not null,
  title text not null,
  synopsis text not null,
  kind text not null default 'episode' check (kind in ('episode', 'recap', 'filler')),
  embedding vector,
  embedding_model text,
  unique (franchise_id, global_order)
);

create index episode_franchise_idx on episode (franchise_id);

create table ingest_run (
  id bigserial primary key,
  franchise_id bigint not null references franchise (id) on delete cascade,
  status text not null check (status in ('running', 'done', 'failed')),
  step text not null,
  progress integer not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index ingest_run_franchise_idx on ingest_run (franchise_id, started_at desc);

-- A recap is written from that one episode's synopsis only, so it can never leak later events.
create table recap_cache (
  episode_id bigint primary key references episode (id) on delete cascade,
  recap text not null,
  model text not null,
  created_at timestamptz not null default now()
);

create table query_cache (
  franchise_id bigint not null references franchise (id) on delete cascade,
  query_hash text not null,
  mode text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (franchise_id, query_hash, mode)
);

-- Fixed-window counters for per-address limits and the daily AI budget.
create table rate_counter (
  bucket text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (bucket, window_start)
);
