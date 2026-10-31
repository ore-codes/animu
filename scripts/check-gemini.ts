// Confirms the Gemini key and model names work before you deploy. Reads .env; prints no secrets.
// Usage: npm run check:gemini
import { env } from '../src/lib/env';
import { generateJson } from '../src/server/ai';
import { GeminiEmbedder } from '../src/server/embeddings/gemini';

const e = env();
const problems: string[] = [];
if (!e.GEMINI_API_KEY) problems.push('GEMINI_API_KEY is empty');
if (!e.GEMINI_EMBED_MODEL) problems.push('GEMINI_EMBED_MODEL is empty');
if (!e.GEMINI_MODEL) problems.push('GEMINI_MODEL is empty');
if (e.EMBEDDING_PROVIDER !== 'gemini') problems.push('EMBEDDING_PROVIDER should be gemini for production');
if (problems.length) {
  console.error('Fix first:\n- ' + problems.join('\n- '));
  process.exit(1);
}

let failed = false;
const step = async (name: string, fn: () => Promise<string>) => {
  try {
    console.log(`ok    ${name}: ${await fn()}`);
  } catch (err) {
    failed = true;
    console.log(`FAIL  ${name}: ${err instanceof Error ? err.message : err}`);
  }
};

const embedder = new GeminiEmbedder(e.GEMINI_API_KEY!, e.GEMINI_EMBED_MODEL!, e.GEMINI_EMBED_DIMENSIONS);

await step('document embeddings', async () => {
  const [v] = await embedder.embedDocuments(['Gon and Killua meet a tiny woman who agrees to train them.']);
  return `${v.length} dimensions`;
});
await step('query embedding', async () => `${(await embedder.embedQuery('a doll-like teacher')).length} dimensions`);
await step('structured generation', async () => {
  const out = await generateJson<{ word: string }>('Reply with JSON only.', 'Give one word that rhymes with cat.', {
    type: 'OBJECT',
    properties: { word: { type: 'STRING' } },
    required: ['word'],
  });
  return `returned ${JSON.stringify(out)}`;
});

console.log(`\nembedding id that will be stored with vectors: ${embedder.id}`);
process.exit(failed ? 1 : 0);
