import { GoogleGenerativeAI, Schema } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const responseSchema: Schema = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: "object" as any,
  description: "Sentiment analysis results including an overall summary and episode breakdown",
  properties: {
    summary: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "string" as any,
      description: "A 2 to 3 sentence engaging overview of the anime's emotional journey from start to finish."
    },
    episodes: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "array" as any,
      description: "List of sentiment analyses for each episode",
      items: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: "object" as any,
        properties: {
          episodeNumber: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: "integer" as any,
            description: "The episode number being analyzed"
          },
          score: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: "number" as any,
            description: "A sentiment score from -1.0 (Dark, Tragic, Tense) to 1.0 (Wholesome, Triumphant, Lighthearted)"
          },
          reasoning: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: "string" as any,
            description: "A short 1-sentence summary of why this episode received this specific sentiment score"
          }
        },
        required: ["episodeNumber", "score", "reasoning"]
      }
    }
  },
  required: ["summary", "episodes"]
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

  const { episodes } = req.body;

  if (!episodes || !Array.isArray(episodes) || episodes.length === 0) {
    return res.status(400).json({ error: "No episodes provided for analysis." });
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
        "You are an expert anime critic and narrative analyst. I will provide a list of anime episodes and their synopses. " +
        "Your goal is twofold: First, generate a 2-3 sentence summary of the overall emotional journey of the show. " +
        "Second, evaluate the emotional tone of EACH episode and assign it a sentiment score onto a scale from " +
        "-1.0 (Dark, Tragic, Bleak, Tense, Despair) to 1.0 (Wholesome, Joyful, Triumphant, Comedy, Lighthearted). " +
        "Provide a 1-sentence summary of why it deserves this score."
    });

    const inputList = episodes.map(ep => 
      `Episode ${ep.mal_id}: ${ep.title}\nSynopsis: ${ep.synopsis || "No synopsis available."}`
    ).join("\n\n");

    const prompt = `Analyze the emotional trajectory of the following anime episodes:\n\n${inputList}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);
    
    // Validate bounds
    const formattedResponse = {
      summary: data.summary,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      episodes: data.episodes.map((ep: any) => ({
        ...ep,
        score: Math.max(-1.0, Math.min(1.0, ep.score)) // Ensure it's between -1 and 1
      }))
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error("Failed to analyze sentiment backend:", error);
    return res.status(500).json({ error: "Analysis failed. Check your API key or try again." });
  }
}
