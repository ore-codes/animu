export function stripHtml(html: string | null | undefined): string {
  return (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** First n sentences, used when no AI is available. */
export function firstSentences(text: string, n: number): string {
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!parts) return text;
  return parts.slice(0, n).join('').trim();
}
