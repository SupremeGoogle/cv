// TEMPORARY smoke test for the automatic generation path.
//
//   POST /api/test-generation?secret=<WEBHOOK_SECRET>
//   { "compositeImage": "<base64 of the two-panel sheet>" }
//
// It deliberately skips KV and the rate limits so the DeepInfra + Telegram legs
// can be verified while the store is down. It spends real money on every call,
// which is why it is admin-guarded — and why it should be deleted once the
// normal flow is confirmed working.

import { requireAdminSecret } from './_lib/guard.js';
import { generateWorkplacePhoto, deepinfraModel, deepinfraToken } from './_lib/deepinfra.js';
import { adminChatId, tgSendPhotoBase64 } from './_lib/telegram.js';

export const config = { maxDuration: 60 };

const readJsonBody = async (req: any): Promise<{ compositeImage?: string }> => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { /* fall through */ }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

export default async function handler(req: any, res: any) {
  if (!requireAdminSecret(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Используйте POST с полем compositeImage.' });
    return;
  }
  if (!deepinfraToken()) {
    res.status(500).json({ error: 'DEEPINFRA_TOKEN не задан.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Некорректный JSON.' });
    return;
  }

  const compositeImage = body.compositeImage?.trim();
  if (!compositeImage) {
    res.status(400).json({ error: 'Поле compositeImage обязательно.' });
    return;
  }

  const startedAt = Date.now();
  try {
    const generated = await generateWorkplacePhoto(compositeImage);
    const elapsedSec = Math.round((Date.now() - startedAt) / 1000);

    await tgSendPhotoBase64(
      adminChatId(),
      generated.base64,
      `🧪 <b>Тест автогенерации</b>\n\nМодель: <code>${deepinfraModel()}</code>\nВремя: ${elapsedSec}с\n\nЭто результат тестового прогона — так фото увидит посетитель сайта.`,
    );

    res.status(200).json({
      ok: true,
      elapsedSec,
      model: deepinfraModel(),
      resultBytes: Math.round((generated.base64.length * 3) / 4),
      sentToTelegram: true,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    res.status(200).json({
      ok: false,
      elapsedSec: Math.round((Date.now() - startedAt) / 1000),
      model: deepinfraModel(),
      error: detail,
    });
  }
}
