const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
    if (res.status === 429 || res.status >= 500) {
      lastStatus = res.status;
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
    return (await res.json()) as T;
  }
  throw new Error(`${lastStatus} from ${new URL(url).host} after retries`);
}
