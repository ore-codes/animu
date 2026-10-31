import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_ORIGIN: z.string().url().optional(),
  EMBEDDING_PROVIDER: z.enum(['local', 'gemini']).default('local'),
  GEMINI_EMBED_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  AI_DAILY_CALL_LIMIT: z.coerce.number().int().min(0).default(300),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    // Empty strings in .env mean "unset".
    const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
    cached = schema.parse(raw);
  }
  return cached;
}

/** Smart ranking and recaps need both a key and a model name. */
export function aiEnabled(e: Env = env()): boolean {
  return Boolean(e.GEMINI_API_KEY && e.GEMINI_MODEL);
}
