import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL = 'postgres://unused';
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_MODEL = 'test-model';

const { GeminiEmbedder } = await import('@/server/embeddings/gemini');
const { generateJson } = await import('@/server/ai');

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('GeminiEmbedder', () => {
  const fetchMock = vi.fn();
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('puts the model and size in the id so mixed vectors are never compared', () => {
    expect(new GeminiEmbedder('k', 'm').id).toBe('gemini:m');
    expect(new GeminiEmbedder('k', 'm', 768).id).toBe('gemini:m:768');
  });

  it('batches documents, sends the key as a header and asks for document vectors', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const n = JSON.parse(init.body).requests.length;
      return ok({ embeddings: Array.from({ length: n }, () => ({ values: [0.1, 0.2] })) });
    });
    const out = await new GeminiEmbedder('secret', 'm', 768).embedDocuments(Array.from({ length: 150 }, (_, i) => `t${i}`));

    expect(out).toHaveLength(150);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/m:batchEmbedContents');
    expect(url).not.toContain('secret');
    expect(init.headers['x-goog-api-key']).toBe('secret');
    const req = JSON.parse(init.body).requests[0];
    expect(req).toMatchObject({ model: 'models/m', taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: 768 });
  });

  it('asks for a query vector for searches and omits the size when unset', async () => {
    fetchMock.mockResolvedValue(ok({ embedding: { values: [1, 2, 3] } }));
    expect(await new GeminiEmbedder('k', 'm').embedQuery('hello')).toEqual([1, 2, 3]);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.taskType).toBe('RETRIEVAL_QUERY');
    expect(body).not.toHaveProperty('outputDimensionality');
  });

  it('rejects when the count of vectors does not match', async () => {
    fetchMock.mockResolvedValue(ok({ embeddings: [] }));
    await expect(new GeminiEmbedder('k', 'm').embedDocuments(['a'])).rejects.toThrow('wrong number');
  });

  it('fails clearly on an error status', async () => {
    fetchMock.mockResolvedValue(new Response('no', { status: 403 }));
    await expect(new GeminiEmbedder('k', 'm').embedQuery('x')).rejects.toThrow('403');
  });
});

describe('generateJson', () => {
  const fetchMock = vi.fn();
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  const schema = { type: 'OBJECT', properties: { a: { type: 'STRING' } } } as const;

  it('sends the schema and parses the JSON text', async () => {
    fetchMock.mockResolvedValue(ok({ candidates: [{ content: { parts: [{ text: '{"a":"b"}' }] } }] }));
    expect(await generateJson('sys', 'prompt', schema)).toEqual({ a: 'b' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/test-model:generateContent');
    const body = JSON.parse(init.body);
    expect(body.generationConfig).toMatchObject({ responseMimeType: 'application/json', responseSchema: schema });
    expect(body.systemInstruction.parts[0].text).toBe('sys');
  });

  it('throws when the model returns no text', async () => {
    fetchMock.mockResolvedValue(ok({ candidates: [] }));
    await expect(generateJson('s', 'p', schema)).rejects.toThrow('no text');
  });

  it('throws on malformed JSON', async () => {
    fetchMock.mockResolvedValue(ok({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }));
    await expect(generateJson('s', 'p', schema)).rejects.toThrow();
  });
});
