// Visitor leaves an email after waiting too long. We attach it to the request
// and ping the admin in Telegram so they can mail the result later.

import { kvGet, kvSet } from './_lib/kv';
import { adminChatId, tgSendMessage } from './_lib/telegram';

type SubmitBody = { id?: string; email?: string };

type StoredRequest = {
  id: string;
  status: 'pending' | 'done';
  createdAt: number;
  email: string | null;
  resultImage: string | null;
  resultMimeType: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readJsonBody = async (req: any): Promise<SubmitBody> => {
  if (req.body && typeof req.body === 'object') return req.body as SubmitBody;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { /* fall through */ }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
    return;
  }

  let body: SubmitBody;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Некорректное тело запроса.' });
    return;
  }

  const id = body.id?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!id || !email) {
    res.status(400).json({ error: 'Поля id и email обязательны.' });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Похоже, это не email — проверьте написание.' });
    return;
  }

  try {
    const stored = await kvGet<StoredRequest>(`req:${id}`);
    if (!stored) {
      res.status(404).json({ error: 'Заявка не найдена или истекла.' });
      return;
    }

    // Idempotent: if email already set, just confirm.
    if (stored.email === email) {
      res.status(200).json({ ok: true });
      return;
    }

    const updated: StoredRequest = { ...stored, email };
    await kvSet(`req:${id}`, updated);

    await tgSendMessage(
      adminChatId(),
      `📧 По заявке <b>#${id}</b> клиент оставил почту: <code>${email}</code>\n\nКогда будешь готов, пришли фото боту — я сохраню результат и ты сможешь отправить его на эту почту.`,
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Не удалось сохранить почту.',
    });
  }
}
