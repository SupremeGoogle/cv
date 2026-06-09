// Lightweight polling endpoint. The frontend hits this every ~2s while waiting
// for the admin to upload the generated image via Telegram.

import { kvGet } from './_lib/kv.js';

type StoredRequest = {
  id: string;
  status: 'pending' | 'done';
  createdAt: number;
  email: string | null;
  resultImage: string | null;
  resultMimeType: string | null;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Метод не поддерживается. Используйте GET.' });
    return;
  }

  const id = (req.query?.id || '').toString().trim();
  if (!id) {
    res.status(400).json({ error: 'Параметр id обязателен.' });
    return;
  }

  try {
    const stored = await kvGet<StoredRequest>(`req:${id}`);
    if (!stored) {
      res.status(404).json({ error: 'Заявка не найдена или истёк срок хранения.' });
      return;
    }

    if (stored.status === 'done' && stored.resultImage) {
      res.status(200).json({
        status: 'done',
        image: stored.resultImage,
        mimeType: stored.resultMimeType || 'image/jpeg',
      });
      return;
    }

    res.status(200).json({
      status: 'pending',
      emailSubmitted: !!stored.email,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Ошибка чтения статуса.',
    });
  }
}
