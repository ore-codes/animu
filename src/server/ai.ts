import { env } from '@/lib/env';
import { GoogleGenerativeAI, type Schema } from '@google/generative-ai';

type Obj = Record<string, unknown>;

/** Runs one JSON-mode generation. Callers must validate the result: model output is untrusted. */
export async function generateJson<T = Obj>(system: string, prompt: string, schema: Schema): Promise<T> {
  const { GEMINI_API_KEY, GEMINI_MODEL } = env();
  if (!GEMINI_API_KEY || !GEMINI_MODEL) throw new Error('AI is not configured');
  const model = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: system,
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
  });
  const res = await model.generateContent(prompt);
  return JSON.parse(res.response.text()) as T;
}
