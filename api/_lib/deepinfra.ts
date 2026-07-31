// DeepInfra image-editing client (no SDK, just fetch).
//
// We use the OpenAI-compatible /v1/openai/images/edits endpoint. Per DeepInfra's
// schema it takes a single `image` file plus a `prompt`, which is why the caller
// passes an already-composed two-panel image — see _lib/prompt.ts.
//
// To switch models, set DEEPINFRA_IMAGE_MODEL. Candidates worth trying:
//   google/nano-banana-2      — best identity preservation (default), token-priced
//   ByteDance/Seedream-4.5    — flat $0.04/image, strong multi-image fusion
//   black-forest-labs/FLUX-2-pro — cheapest of the usable ones

import { WORKPLACE_PROMPT } from './prompt.js';

const EDITS_ENDPOINT = 'https://api.deepinfra.com/v1/openai/images/edits';
const DEFAULT_MODEL = 'google/nano-banana-2';

// Vercel functions cap out at 60s; leave room to still write the result to KV
// and answer the client instead of being killed mid-flight.
const REQUEST_TIMEOUT_MS = 50_000;

export const deepinfraToken = () => process.env.DEEPINFRA_TOKEN || '';
export const deepinfraModel = () => process.env.DEEPINFRA_IMAGE_MODEL || DEFAULT_MODEL;

export const deepinfraEnvStatus = () => ({
  hasToken: !!deepinfraToken(),
  model: deepinfraModel(),
});

export type GeneratedImage = { base64: string; mimeType: string };

const extractError = async (res: Response): Promise<string> => {
  const text = await res.text().catch(() => '');
  if (!text) return `DeepInfra вернул ${res.status} без тела ответа.`;
  try {
    const parsed = JSON.parse(text);
    const detail = parsed?.error?.message || parsed?.error || parsed?.detail || parsed?.message;
    if (typeof detail === 'string') return `DeepInfra ${res.status}: ${detail}`;
    if (detail) return `DeepInfra ${res.status}: ${JSON.stringify(detail)}`;
  } catch {
    // not JSON — fall through to the raw body
  }
  return `DeepInfra ${res.status}: ${text.slice(0, 300)}`;
};

/**
 * Send the composed two-panel image to DeepInfra and return the generated photo.
 * `compositeBase64` is raw base64 (no data: prefix).
 */
export const generateWorkplacePhoto = async (
  compositeBase64: string,
  size = '1024x1024',
): Promise<GeneratedImage> => {
  const token = deepinfraToken();
  if (!token) throw new Error('DEEPINFRA_TOKEN не задан в переменных окружения.');

  const form = new FormData();
  form.append('image', new Blob([Buffer.from(compositeBase64, 'base64')], { type: 'image/jpeg' }), 'composite.jpg');
  form.append('prompt', WORKPLACE_PROMPT);
  form.append('model', deepinfraModel());
  form.append('n', '1');
  form.append('size', size);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(EDITS_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form as any,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('DeepInfra не ответил за 50 секунд.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(await extractError(res));

  const payload: any = await res.json();
  const first = payload?.data?.[0];
  const b64: string | undefined = first?.b64_json;
  if (!b64) {
    throw new Error(`DeepInfra не вернул изображение: ${JSON.stringify(payload).slice(0, 300)}`);
  }

  return { base64: b64, mimeType: 'image/jpeg' };
};
