// Telegram webhook. Two events we care about:
//
//  1. callback_query with data = "upload:<requestId>" — admin tapped the
//     "Upload result" button. Remember which request we're waiting a photo for.
//
//  2. message with a photo, from the admin — save it as the result image for
//     the currently armed request, mark the request done. The visitor's next
//     poll will pick it up.

import { kvDel, kvGet, kvSet } from './_lib/kv.js';
import {
  adminChatId,
  tgAnswerCallback,
  tgDownloadFileAsBase64,
  tgSendMessage,
} from './_lib/telegram.js';

type StoredRequest = {
  id: string;
  status: 'pending' | 'done';
  createdAt: number;
  email: string | null;
  resultImage: string | null;
  resultMimeType: string | null;
};

const PENDING_KEY = 'admin:pending';   // which requestId the admin is about to reply to
const PENDING_TTL = 60 * 30;            // 30 min

const readJsonBody = async (req: any): Promise<any> => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { /* fall through */ }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const fromAdmin = (chatIdLike: number | string | undefined): boolean => {
  if (chatIdLike == null) return false;
  try { return String(chatIdLike) === adminChatId(); } catch { return false; }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(200).end();
    return;
  }

  let update: any;
  try {
    update = await readJsonBody(req);
  } catch {
    res.status(200).end();
    return;
  }

  // Always 200 to Telegram — otherwise it will retry forever and hammer our function.
  try {
    await handleUpdate(update);
  } catch (err) {
    console.error('telegram-webhook error:', err);
  }
  res.status(200).json({ ok: true });
}

async function handleUpdate(update: any) {
  // ── 1. Callback from inline button ───────────────────────────────────────
  const callback = update.callback_query;
  if (callback) {
    const data: string = callback.data || '';
    const callbackId: string = callback.id;
    const fromId = callback.from?.id;

    if (!fromAdmin(fromId)) {
      await tgAnswerCallback(callbackId, 'Эта кнопка только для админа.');
      return;
    }

    if (data.startsWith('upload:')) {
      const requestId = data.slice('upload:'.length);
      const stored = await kvGet<StoredRequest>(`req:${requestId}`);
      if (!stored) {
        await tgAnswerCallback(callbackId, 'Эта заявка уже истекла.');
        return;
      }
      if (stored.status === 'done') {
        await tgAnswerCallback(callbackId, 'По этой заявке уже отправлен результат.');
        return;
      }
      await kvSet(PENDING_KEY, { requestId, armedAt: Date.now() }, PENDING_TTL);
      await tgAnswerCallback(callbackId, 'Готов принять фото.');
      await tgSendMessage(
        adminChatId(),
        `📥 Жду фото-результат для заявки <b>#${requestId}</b>.\n\nПросто пришли картинку сюда — я сохраню её и покажу клиенту на сайте.`,
      );
      return;
    }

    await tgAnswerCallback(callbackId);
    return;
  }

  // ── 2. Photo message from admin ──────────────────────────────────────────
  const message = update.message || update.edited_message;
  if (!message) return;

  if (!fromAdmin(message.from?.id)) return;

  // /start handler — just a friendly hello, helps confirm the bot is alive.
  if (message.text === '/start') {
    await tgSendMessage(
      message.chat.id,
      '👋 Привет! Я бот сайта-портфолио. Когда кто-то загрузит фото рабочего места, я пришлю его сюда. Жми кнопку под фото и присылай готовый результат — я отдам его клиенту.',
    );
    return;
  }

  // Could be a photo (compressed) or a document (uncompressed). Handle both.
  let fileId: string | null = null;
  if (Array.isArray(message.photo) && message.photo.length) {
    // photo is an array of sizes; take the largest.
    fileId = message.photo[message.photo.length - 1].file_id;
  } else if (message.document && typeof message.document.mime_type === 'string'
             && message.document.mime_type.startsWith('image/')) {
    fileId = message.document.file_id;
  }

  if (!fileId) return; // not a photo — ignore silently

  const pending = await kvGet<{ requestId: string }>(PENDING_KEY);
  if (!pending?.requestId) {
    await tgSendMessage(
      message.chat.id,
      '⚠️ Я не знаю, к какой заявке относится это фото. Сначала нажми кнопку <b>«Загрузить готовое фото»</b> под нужной заявкой, а потом пришли картинку.',
    );
    return;
  }

  const stored = await kvGet<StoredRequest>(`req:${pending.requestId}`);
  if (!stored) {
    await kvDel(PENDING_KEY);
    await tgSendMessage(message.chat.id, '⚠️ Заявка истекла. Попроси клиента нажать «Сгенерировать» ещё раз.');
    return;
  }

  let downloaded: { base64: string; mimeType: string };
  try {
    downloaded = await tgDownloadFileAsBase64(fileId);
  } catch (err) {
    await tgSendMessage(message.chat.id, `⚠️ Не получилось скачать фото из Telegram: ${err instanceof Error ? err.message : err}`);
    return;
  }

  const updated: StoredRequest = {
    ...stored,
    status: 'done',
    resultImage: downloaded.base64,
    resultMimeType: downloaded.mimeType,
  };
  await kvSet(`req:${pending.requestId}`, updated);
  await kvDel(PENDING_KEY);

  const emailLine = stored.email
    ? `\n\n📧 Не забудь отправить это фото на почту клиента: <code>${stored.email}</code>`
    : '';

  await tgSendMessage(
    message.chat.id,
    `✅ Результат для заявки <b>#${pending.requestId}</b> сохранён. Если клиент ещё на сайте — он увидит фото в ближайшие секунды.${emailLine}`,
  );
}
