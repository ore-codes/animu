# Animu

Animu is an open-source web application built for the anime community to solve the problem of managing and exploring long-running shows.

You can try it live here: [https://animu.net](https://animu.net)

## Features

### Arc Search (Franchise-Wide)
When an anime takes a long break or you fall behind, it is hard to remember exactly where you stopped watching. Searching for specific events across hundreds of episodes is painful. 

Animu allows you to search for vague plot points (e.g., "Killua met Biski"). The **Arc Search** pulls data for the entire anime franchise automatically—crawling related seasons, prequels, and sequels—and ranks the episodes by relevance to help you find the exact episode you need.

### Sentiment Map
It is often difficult to figure out if a new show is worth continuing or if its tone matches what you want to watch. 

The **Sentiment Map** feature uses AI to read the synopsis of every episode in a series and grades the emotional tone. The app then graphs these scores over the course of the show. If a viewer wants to know if an anime stays lighthearted or eventually turns dark, they can see the overall emotional arc at a glance before they decide to start watching.

### Deep AI Search
If the local keyword matching in the Arc Search does not find the episode you are looking for, you can escalate the query to the **Ask AI Deep Search**. This leverages the Gemini 2.5 Flash model, combined with the episode context, to find the exact match and provide an explanation.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Recharts
- **APIs:** 
  - [Jikan API](https://jikan.moe/) (Unofficial MyAnimeList API) for anime metadata and franchise relations
  - [Kitsu API](https://kitsu.docs.apiary.io/) for episode synopses
- **AI Integration:** Google Gemini API (gemini-2.5-flash) via `@google/generative-ai`
- **Hosting / Backend:** Vercel (Frontend & Serverless Functions)

## Getting Started

To run this project locally, you will need a Google Gemini API Key.

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Gemini API key (this is used by the Vercel serverless functions in development):
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server using the Vercel CLI to ensure the serverless functions work:
   ```bash
   npx vercel dev
   ```

## Architecture

- The application uses client-side data fetching for the Jikan and Kitsu APIs to reduce server load.
- It utilizes client-side caching (`localStorage`) for AI responses to speed up repeated queries and save API quota.
- API keys are secured behind Vercel Serverless Functions to prevent client-side exposure.

## License

MIT
