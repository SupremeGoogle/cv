// Vercel serverless function: proxies image editing to Google Gemini.
// The API key lives ONLY here (server env), never in the browser bundle.
// Set GEMINI_API_KEY in Vercel → Project → Settings → Environment Variables.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 90000;

type InputImage = { mimeType?: string; data?: string };

const readJsonBody = async (req: any): Promise<any> => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch { /* fall through to stream read */ }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const extractGeminiError = (payload: any): string => {
  const message = payload?.error?.message || payload?.message;
  if (typeof message === 'string' && message.trim()) return message;
  return 'Gemini не смог обработать изображение.';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'На сервере не задан GEMINI_API_KEY.' });
    return;
  }

  let body: any;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Некорректное тело запроса.' });
    return;
  }

  const prompt: string = typeof body?.prompt === 'string' ? body.prompt : '';
  const images: InputImage[] = Array.isArray(body?.images) ? body.images : [];

  if (!prompt || !images.length) {
    res.status(400).json({ error: 'Нужны поля prompt и images.' });
    return;
  }

  const parts: any[] = [{ text: prompt }];
  for (const image of images) {
    if (!image?.data) continue;
    parts.push({
      inline_data: {
        mime_type: image.mimeType || 'image/png',
        data: image.data,
      },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: '3:2' },
        },
      }),
      signal: controller.signal,
    });

    const rawText = await geminiResponse.text();
    let payload: any = null;
    try { payload = JSON.parse(rawText); } catch { /* keep null for fallback */ }

    if (!geminiResponse.ok) {
      res.status(geminiResponse.status).json({ error: extractGeminiError(payload) });
      return;
    }

    const responseParts: any[] = payload?.candidates?.[0]?.content?.parts || [];
    const imagePart = responseParts.find(part => part?.inlineData?.data || part?.inline_data?.data);
    const inline = imagePart?.inlineData || imagePart?.inline_data;

    if (!inline?.data) {
      res.status(502).json({ error: 'Gemini вернул ответ без изображения.' });
      return;
    }

    res.status(200).json({
      image: inline.data,
      mimeType: inline.mimeType || inline.mime_type || 'image/png',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({ error: 'Gemini слишком долго отвечает. Попробуйте фото меньшего размера.' });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Ошибка обращения к Gemini.' });
  } finally {
    clearTimeout(timeout);
  }
}
