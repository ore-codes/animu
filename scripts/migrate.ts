import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const db = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const dir = path.join(process.cwd(), 'db', 'migrations');

await db`create table if not exists schema_migration (name text primary key, applied_at timestamptz not null default now())`;
const applied = new Set((await db`select name from schema_migration`).map((r) => r.name as string));

for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue;
  const body = await readFile(path.join(dir, file), 'utf8');
  await db.begin(async (tx) => {
    await tx.unsafe(body);
    await tx`insert into schema_migration (name) values (${file}) on conflict do nothing`;
  });
  console.log(`applied ${file}`);
}

await db.end();
console.log('migrations up to date');
