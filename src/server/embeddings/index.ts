import { env } from '@/lib/env';

export interface Embedder {
  /** Stored with every vector. Queries only match vectors made by the same id. */
  id: string;
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

let cached: Promise<Embedder> | undefined;

export function getEmbedder(): Promise<Embedder> {
  cached ??= (async () => {
    const e = env();
    if (e.EMBEDDING_PROVIDER === 'gemini') {
      if (!e.GEMINI_API_KEY || !e.GEMINI_EMBED_MODEL) {
        throw new Error('EMBEDDING_PROVIDER=gemini needs GEMINI_API_KEY and GEMINI_EMBED_MODEL');
      }
      const { GeminiEmbedder } = await import('./gemini');
      return new GeminiEmbedder(e.GEMINI_API_KEY, e.GEMINI_EMBED_MODEL, e.GEMINI_EMBED_DIMENSIONS);
    }
    // The local model's binaries are excluded from the serverless build, so fail with a clear message.
    if (process.env.VERCEL) throw new Error('Set EMBEDDING_PROVIDER=gemini: the local embedding model does not run on Vercel');
    const { LocalEmbedder } = await import('./local');
    return new LocalEmbedder();
  })();
  return cached;
}
