import { env } from '@/lib/env';

/** JSON schema subset accepted by generateContent. Type names are upper case. */
export type JsonSchema = {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'INTEGER' | 'NUMBER' | 'BOOLEAN';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
  format?: string;
  description?: string;
};

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 12_000;
const ATTEMPTS = 3;
const RETRYABLE = (status: number) => status === 404 || status === 429 || status >= 500;

type GenerateResponse = { candidates?: { content?: { parts?: { text?: string }[] } }[] };

/** Runs one JSON-mode generation. Callers must validate the result: model output is untrusted. */
export async function generateJson<T>(system: string, prompt: string, schema: JsonSchema): Promise<T> {
  const { GEMINI_API_KEY, GEMINI_MODEL } = env();
  if (!GEMINI_API_KEY || !GEMINI_MODEL) throw new Error('AI is not configured');

  const request = () =>
    fetch(`${BASE}/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

  // The endpoint sometimes answers 404, 429 or 5xx for a model that works a moment later.
  let res = await request();
  for (let attempt = 1; !res.ok && RETRYABLE(res.status) && attempt < ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, 500 * attempt));
    res = await request();
  }
  if (!res.ok) throw new Error(`Gemini generateContent returned ${res.status}`);

  const data = (await res.json()) as GenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) throw new Error('Gemini returned no text');
  return JSON.parse(text) as T;
}
