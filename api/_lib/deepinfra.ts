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

import { WORKPLACE_PROMPT, MULTI_IMAGE_PROMPT } from './prompt.js';

const EDITS_ENDPOINT = 'https://api.deepinfra.com/v1/openai/images/edits';
const DEFAULT_MODEL = 'google/nano-banana-2';

// Vercel functions cap out at 60s; leave room to still write the result to KV
// and answer the client instead of being killed mid-flight.
const REQUEST_TIMEOUT_MS = 50_000;

export const deepinfraToken = () => process.env.DEEPINFRA_TOKEN || '';
export const deepinfraModel = () => process.env.DEEPINFRA_IMAGE_MODEL || DEFAULT_MODEL;
// Off by default — see the note in generateWorkplacePhoto.
export const multiImageEnabled = () => process.env.DEEPINFRA_MULTI_IMAGE === '1';

export const deepinfraEnvStatus = () => ({
  hasToken: !!deepinfraToken(),
  model: deepinfraModel(),
  multiImage: multiImageEnabled(),
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

const blobOf = (base64: string) => new Blob([Buffer.from(base64, 'base64')], { type: 'image/jpeg' });

/**
 * Send images to DeepInfra and return the generated photo.
 *
 * Two shapes are attempted, in order:
 *  1. `image[]` twice — reference and scene as separate inputs. OpenAI's own
 *     images/edits accepts an array, and when the provider does too the model
 *     never sees a glued sheet, so it cannot hand one back.
 *  2. a single composed two-panel image, used when the provider rejects (1).
 *
 * The fallback matters because the sheet is what produced results with the
 * identity reference still stuck to one side.
 */
const postEdit = async (
  parts: { name: string; base64: string; filename: string }[],
  prompt: string,
  size: string,
  token: string,
) => {
  const form = new FormData();
  for (const part of parts) form.append(part.name, blobOf(part.base64), part.filename);
  form.append('prompt', prompt);
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

  if (!res.ok) {
    const message = await extractError(res);
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const payload: any = await res.json();
  const b64: string | undefined = payload?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`DeepInfra не вернул изображение: ${JSON.stringify(payload).slice(0, 300)}`);
  }

  return { base64: b64, mimeType: 'image/jpeg' } as GeneratedImage;
};

export type GenerateInput = {
  /** Identity reference — the portrait. */
  referenceBase64?: string;
  /** The visitor's workplace photo. */
  sceneBase64?: string;
  /** Pre-glued two-panel sheet, used when the provider only takes one image. */
  compositeBase64: string;
};

export const generateWorkplacePhoto = async (
  input: GenerateInput,
  size = '1024x1024',
): Promise<GeneratedImage & { mode: 'multi' | 'composite' }> => {
  const token = deepinfraToken();
  if (!token) throw new Error('DEEPINFRA_TOKEN не задан в переменных окружения.');

  // Sending the two files separately is only tried when explicitly switched on.
  // The endpoint accepted a repeated file without complaint but appears to keep
  // just the last one: the scene arrived, the portrait was dropped, and the model
  // invented a stranger to sit at the desk. A silent wrong answer is worse than
  // the glued sheet, which at least preserves the face — and the sheet is now
  // reliably split back into one photo.
  if (multiImageEnabled() && input.referenceBase64 && input.sceneBase64) {
    // Providers disagree on how a multi-image edit is spelled: OpenAI takes
    // repeated `image[]`, others take a plain repeated `image`. Try both before
    // giving up on separate files, because the glued sheet is what makes the
    // model answer with two panels in the first place.
    const shapes: { label: string; field: string }[] = [
      { label: 'image[]', field: 'image[]' },
      { label: 'image', field: 'image' },
    ];

    for (const shape of shapes) {
      try {
        const result = await postEdit(
          [
            { name: shape.field, base64: input.referenceBase64, filename: 'reference.jpg' },
            { name: shape.field, base64: input.sceneBase64, filename: 'scene.jpg' },
          ],
          MULTI_IMAGE_PROMPT,
          size,
          token,
        );
        return { ...result, mode: 'multi' };
      } catch (error) {
        const status = (error as { status?: number }).status;
        // Only a rejection of the request shape is worth another attempt. A
        // timeout or a 5xx would just burn another 50 seconds.
        if (status && status >= 400 && status < 500) {
          console.warn(`[deepinfra] multi-image as "${shape.label}" rejected (${status}): ${(error as Error).message}`);
          continue;
        }
        throw error;
      }
    }
    console.warn('[deepinfra] no multi-image shape accepted, falling back to the composite sheet');
  }

  const result = await postEdit(
    [{ name: 'image', base64: input.compositeBase64, filename: 'composite.jpg' }],
    WORKPLACE_PROMPT,
    size,
    token,
  );
  return { ...result, mode: 'composite' };
};
