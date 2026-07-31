// Automatic generation. Runs after /api/start-generation has already registered
// the request and armed the manual Telegram fallback, so every failure here is
// survivable: the visitor keeps waiting on the same polling loop and the admin
// can still answer by hand.
//
// Flow:
//   1. Check the spend guards (per-IP + global, in KV).
//   2. Send the composed two-panel image to DeepInfra.
//   3. Store the result in KV — the visitor's /api/check-status poll picks it up.
//   4. Show the result to the admin in Telegram with a "Replace" button, so a
//      bad generation can be overridden by hand.

import { kvGet, kvSet } from './_lib/kv.js';
import { generateWorkplacePhoto, deepinfraToken, deepinfraModel } from './_lib/deepinfra.js';
import { keepGeneratedHalf } from './_lib/split-result.js';
import { clientIp, reserveAutoGeneration } from './_lib/limits.js';
import { adminChatId, tgSendPhotoBase64, tgSendMessage } from './_lib/telegram.js';

// The DeepInfra call alone can take ~30s; give the function room around it.
export const config = { maxDuration: 60 };

const REQUEST_TTL_SECONDS = 60 * 60 * 24;

type StoredRequest = {
  id: string;
  status: 'pending' | 'done';
  createdAt: number;
  email: string | null;
  resultImage: string | null;
  resultMimeType: string | null;
  source?: 'auto' | 'manual';
};

type GenerateBody = {
  requestId?: string;
  compositeImage?: string; // base64 sheet — fallback when the provider takes one image
  referenceImage?: string; // base64 portrait
  sceneImage?: string;     // base64 workplace photo
};

const readJsonBody = async (req: any): Promise<GenerateBody> => {
  if (req.body && typeof req.body === 'object') return req.body as GenerateBody;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { /* fall through */ }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

// Never a 5xx: the client treats "no auto result" as "wait for the manual one",
// and an error status would only make it show a scary message.
const softFail = (res: any, reason: string, detail?: string) => {
  console.warn(`[generate] falling back to manual: ${reason}${detail ? ` — ${detail}` : ''}`);
  res.status(200).json({ generated: false, reason, detail });
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
    return;
  }

  let body: GenerateBody;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Некорректное тело запроса.' });
    return;
  }

  const requestId = body.requestId?.trim();
  const compositeImage = body.compositeImage?.trim();
  if (!requestId || !compositeImage) {
    res.status(400).json({ error: 'Поля requestId и compositeImage обязательны.' });
    return;
  }

  if (!deepinfraToken()) {
    softFail(res, 'not-configured', 'DEEPINFRA_TOKEN не задан.');
    return;
  }

  // The request must exist and still be waiting — otherwise a stale retry could
  // overwrite a result the admin already sent by hand.
  let stored: StoredRequest | null;
  try {
    stored = await kvGet<StoredRequest>(`req:${requestId}`);
  } catch (error) {
    softFail(res, 'kv-error', error instanceof Error ? error.message : String(error));
    return;
  }
  if (!stored) {
    softFail(res, 'unknown-request', 'Заявка не найдена или истекла.');
    return;
  }
  if (stored.status === 'done') {
    res.status(200).json({ generated: false, reason: 'already-done' });
    return;
  }

  const ip = clientIp(req);
  const verdict = await reserveAutoGeneration(ip);
  if (!verdict.allowed) {
    softFail(res, `limit-${verdict.reason}`, verdict.detail);
    return;
  }

  const startedAt = Date.now();
  let generated;
  try {
    generated = await generateWorkplacePhoto({
      compositeBase64: compositeImage,
      referenceBase64: body.referenceImage?.trim(),
      sceneBase64: body.sceneImage?.trim(),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    // Worth knowing about: this is the path that spends money and the one that
    // silently degrades the visitor experience when it breaks.
    await tgSendMessage(
      adminChatId(),
      `⚠️ Автогенерация для заявки <b>#${requestId}</b> не удалась:\n<code>${detail}</code>\n\nЗаявка ждёт ручного ответа — нажми «Загрузить готовое фото» под исходником.`,
    ).catch(() => { /* Telegram is a nice-to-have here */ });
    softFail(res, 'api-error', detail);
    return;
  }

  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);

  // The model often answers with the whole two-panel sheet. Drop the half that
  // is just a copy of the scene we sent, so the visitor and Telegram both get
  // the generated photo alone rather than one guessing at a crop.
  const split = keepGeneratedHalf(generated.base64, body.sceneImage?.trim());
  const finalImage = split.base64;
  console.log(`[generate] ${requestId}: done in ${elapsedSec}s via ${deepinfraModel()} (${generated.mode}, split: ${split.action})`);

  try {
    const updated: StoredRequest = {
      ...stored,
      status: 'done',
      resultImage: finalImage,
      resultMimeType: generated.mimeType,
      source: 'auto',
    };
    await kvSet(`req:${requestId}`, updated, REQUEST_TTL_SECONDS);
  } catch (error) {
    softFail(res, 'kv-write-error', error instanceof Error ? error.message : String(error));
    return;
  }

  // Show the admin what the visitor just saw, with an escape hatch.
  await tgSendPhotoBase64(
    adminChatId(),
    finalImage,
    `🤖 <b>Автогенерация #${requestId}</b> готова за ${elapsedSec}с — клиент уже видит это фото.\n\nМодель: <code>${deepinfraModel()}</code> (${generated.mode}, кадр: ${split.action})\nЕсли получилось плохо — нажми кнопку и пришли свой вариант, он заменит этот.`,
    {
      inline_keyboard: [
        [{ text: '♻️ Заменить своим фото', callback_data: `upload:${requestId}` }],
      ],
    },
  ).catch(err => console.error('[generate] Telegram notify failed:', err));

  res.status(200).json({ generated: true, elapsedSec, mode: generated.mode });
}
