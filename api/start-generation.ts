// Start a new generation request:
// 1. Visitor sends a workspace photo (base64) → we mint a request id.
// 2. We store the pending request in KV.
// 3. We forward the photo to the admin on Telegram with an "Upload result" inline button.
// 4. We return { requestId } so the frontend can start polling /api/check-status.

import { kvSet } from './_lib/kv';
import { adminChatId, tgSendPhotoBase64 } from './_lib/telegram';

const REQUEST_TTL_SECONDS = 60 * 60 * 24; // 1 day — plenty for a manual reply

type StartBody = {
  workspaceImage?: string;       // base64, no data: prefix
  workspaceMimeType?: string;    // e.g. image/jpeg
};

const readJsonBody = async (req: any): Promise<StartBody> => {
  if (req.body && typeof req.body === 'object') return req.body as StartBody;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { /* fall through */ }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

// 8-char random id is enough for this volume and easy to read in Telegram.
const newRequestId = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
    return;
  }

  let body: StartBody;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Некорректное тело запроса.' });
    return;
  }

  const workspaceImage = body.workspaceImage?.trim();
  if (!workspaceImage) {
    res.status(400).json({ error: 'Поле workspaceImage обязательно.' });
    return;
  }

  const requestId = newRequestId();

  try {
    // Store the request as "pending" — without the photo (it's already in Telegram).
    await kvSet(
      `req:${requestId}`,
      {
        id: requestId,
        status: 'pending' as const,
        createdAt: Date.now(),
        email: null,
        resultImage: null as string | null,
        resultMimeType: null as string | null,
      },
      REQUEST_TTL_SECONDS,
    );

    // Send the photo to the admin with an inline "Upload result" button.
    await tgSendPhotoBase64(
      adminChatId(),
      workspaceImage,
      `🆕 <b>Новая заявка #${requestId}</b>\n\nКто-то загрузил фото рабочего места на сайте.\nСгенерируй результат в AI Studio и пришли его боту, нажав кнопку ниже.`,
      {
        inline_keyboard: [
          [{ text: '📤 Загрузить готовое фото', callback_data: `upload:${requestId}` }],
        ],
      },
    );

    res.status(200).json({ requestId });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Ошибка создания заявки.',
    });
  }
}
