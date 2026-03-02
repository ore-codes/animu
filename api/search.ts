import { GoogleGenerativeAI, Schema } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const responseSchema: Schema = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: "object" as any,
  description: "Results of the AI deep search for an anime arc/scene.",
  properties: {
    matchedEpisodes: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "array" as any,
      description: "List of the exact episode numbers that best match the query. If it's an arc, an array of all episodes in the arc. If a specific scene, maybe 1-3 episodes. Return empty if absolutely not found.",
      items: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: "integer" as any
      }
    },
    explanation: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "string" as any,
      description: "A 2 to 3 sentence concise explanation of how these episodes answer the user's query."
    }
  },
  required: ["matchedEpisodes", "explanation"]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing Gemini API key on the server." });
  }

  const { animeTitle, query, episodes } = req.body;

  if (!animeTitle || !query || !episodes || !Array.isArray(episodes)) {
    return res.status(400).json({ error: "Missing required fields (animeTitle, query, episodes)." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
      systemInstruction: 
        "You are an expert anime historian and guide. The user is searching for a specific arc, scene, or event in an anime. " +
        "You have access to the anime's title and a list of all its episodes (number, title, synopsis). " +
        "Your goal is to identify exactly which episode(s) match the user's query. Rely on your vast internal knowledge of the anime " +
        "if the provided synopses are too vague. Return the exact episode numbers and a brief, helpful explanation."
    });

    const episodesContext = episodes.map((ep: { mal_id: number; title: string; synopsis?: string }) => 
      `Ep ${ep.mal_id}: ${ep.title}\nSynopsis: ${ep.synopsis || "N/A"}`
    ).join("\n\n");

    const prompt = `Anime: ${animeTitle}\nUser Query: "${query}"\n\nEpisode List Context:\n${episodesContext}\n\nBased on your internal knowledge and the context, which episodes match the query?`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    return res.status(200).json(data);

  } catch (error) {
    console.error("Failed to perform AI arc search:", error);
    return res.status(500).json({ error: "AI search failed. Please try again." });
  }
}
