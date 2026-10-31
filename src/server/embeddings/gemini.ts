import type { Embedder } from './index';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const BATCH = 100;

async function post<T>(url: string, key: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Gemini embeddings returned ${res.status}`);
  return (await res.json()) as T;
}

/** Hosted embeddings for production. Check it with `npm run check:gemini` before deploying. */
export class GeminiEmbedder implements Embedder {
  id: string;

  constructor(
    private key: string,
    private model: string,
    private dimensions?: number,
  ) {
    // Vectors made at a different size must never be compared, so the size is part of the id.
    this.id = `gemini:${model}${dimensions ? `:${dimensions}` : ''}`;
  }

  private request(text: string, taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY') {
    return {
      model: `models/${this.model}`,
      content: { parts: [{ text }] },
      taskType,
      ...(this.dimensions && { outputDimensionality: this.dimensions }),
    };
  }

  async embedDocuments(texts: string[]) {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH) {
      const requests = texts.slice(i, i + BATCH).map((t) => this.request(t, 'RETRIEVAL_DOCUMENT'));
      const res = await post<{ embeddings: { values: number[] }[] }>(`${BASE}/${this.model}:batchEmbedContents`, this.key, { requests });
      if (res.embeddings?.length !== requests.length) throw new Error('Gemini returned the wrong number of embeddings');
      out.push(...res.embeddings.map((e) => e.values));
    }
    return out;
  }

  async embedQuery(text: string) {
    const res = await post<{ embedding: { values: number[] } }>(`${BASE}/${this.model}:embedContent`, this.key, this.request(text, 'RETRIEVAL_QUERY'));
    return res.embedding.values;
  }
}
