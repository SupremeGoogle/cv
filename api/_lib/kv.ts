// Tiny wrapper around Vercel KV / Upstash Redis REST API.
// We talk to it with fetch — no SDK, no dependencies.

// Vercel marketplace may expose these env vars under different names depending
// on which integration created them. Accept all common spellings so the user
// doesn't need to rename anything manually.
const KV_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_URL;
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_TOKEN;

export const kvEnvStatus = () => ({
  hasUrl: !!KV_URL,
  hasToken: !!KV_TOKEN,
  source:
    process.env.KV_REST_API_URL ? 'KV_REST_API_*' :
    process.env.UPSTASH_REDIS_REST_URL ? 'UPSTASH_REDIS_REST_*' :
    process.env.REDIS_URL ? 'REDIS_*' : 'none',
});

const ensureKv = () => {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error(
      'KV не настроен. Ожидаются KV_REST_API_URL/KV_REST_API_TOKEN либо UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN в переменных окружения Vercel.'
    );
  }
};

const headers = () => ({
  Authorization: `Bearer ${KV_TOKEN}`,
  'Content-Type': 'application/json',
});

// Default TTL: 7 days. Requests are short-lived; we don't want stale data piling up.
export const kvSet = async (key: string, value: unknown, ttlSeconds = 60 * 60 * 24 * 7) => {
  ensureKv();
  const url = `${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttlSeconds}`;
  const stringValue = JSON.stringify(value);
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: stringValue,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KV set failed (${res.status}): ${text}`);
  }
};

export const kvGet = async <T = unknown>(key: string): Promise<T | null> => {
  ensureKv();
  const url = `${KV_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KV get failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const raw = data?.result;
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const kvDel = async (key: string) => {
  ensureKv();
  const url = `${KV_URL}/del/${encodeURIComponent(key)}`;
  await fetch(url, { method: 'POST', headers: headers() });
};
