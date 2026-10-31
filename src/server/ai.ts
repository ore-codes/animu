import { env } from '@/lib/env';

/** JSON schema subset accepted by generateContent. Type names are upper case. */
export type JsonSchema = {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'INTEGER' | 'NUMBER' | 'BOOLEAN';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
  format?: string;
};

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

type GenerateResponse = { candidates?: { content?: { parts?: { text?: string }[] } }[] };

/** Runs one JSON-mode generation. Callers must validate the result: model output is untrusted. */
export async function generateJson<T>(system: string, prompt: string, schema: JsonSchema): Promise<T> {
  const { GEMINI_API_KEY, GEMINI_MODEL } = env();
  if (!GEMINI_API_KEY || !GEMINI_MODEL) throw new Error('AI is not configured');

  const res = await fetch(`${BASE}/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Gemini generateContent returned ${res.status}`);

  const data = (await res.json()) as GenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) throw new Error('Gemini returned no text');
  return JSON.parse(text) as T;
}
