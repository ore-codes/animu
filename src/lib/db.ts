import postgres from 'postgres';
import { env } from './env';

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { __animuSql?: Sql };

export function sql(): Sql {
  if (!globalForDb.__animuSql) {
    globalForDb.__animuSql = postgres(env().DATABASE_URL, {
      max: 5,
      onnotice: () => {},
      // bigserial ids come back as numbers (they never approach 2^53 here).
      types: { bigint: { to: 20, from: [20], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) } },
    });
  }
  return globalForDb.__animuSql;
}

/** pgvector accepts a bracketed list as text. */
export function toVector(values: number[]): string {
  return `[${values.join(',')}]`;
}
