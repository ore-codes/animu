import type { Embedder } from './index';

const MODEL = 'Xenova/bge-small-en-v1.5';
const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';

type Extractor = (texts: string[], opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ tolist(): number[][] }>;

/** Runs in-process. For development and tests: too heavy for a serverless function. */
export class LocalEmbedder implements Embedder {
  id = 'local:bge-small-en-v1.5';
  private extractor?: Promise<Extractor>;

  private load(): Promise<Extractor> {
    this.extractor ??= import('@huggingface/transformers').then(
      (m) => m.pipeline('feature-extraction', MODEL) as unknown as Promise<Extractor>,
    );
    return this.extractor;
  }

  private async run(texts: string[]): Promise<number[][]> {
    const extract = await this.load();
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += 32) {
      const t = await extract(texts.slice(i, i + 32), { pooling: 'mean', normalize: true });
      out.push(...t.tolist());
    }
    return out;
  }

  embedDocuments(texts: string[]) {
    return this.run(texts);
  }

  async embedQuery(text: string) {
    return (await this.run([QUERY_PREFIX + text]))[0];
  }
}
