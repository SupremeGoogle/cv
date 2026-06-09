// Minimal Telegram Bot API client (no SDK, just fetch).

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = process.env.TELEGRAM_ADMIN_CHAT_ID;

const ensureBot = () => {
  if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN не задан в env.');
};

export const adminChatId = (): string => {
  if (!ADMIN_CHAT) throw new Error('TELEGRAM_ADMIN_CHAT_ID не задан в env.');
  return ADMIN_CHAT;
};

const callJson = async (method: string, body: unknown) => {
  ensureBot();
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: any = await res.json();
  if (!json?.ok) {
    throw new Error(`Telegram ${method} failed: ${json?.description || res.status}`);
  }
  return json.result;
};

export const tgSendMessage = (chatId: string | number, text: string, replyMarkup?: unknown) =>
  callJson('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });

export const tgAnswerCallback = (callbackQueryId: string, text?: string) =>
  callJson('answerCallbackQuery', { callback_query_id: callbackQueryId, text, show_alert: false });

// Send a base64 photo as a real Telegram photo (compressed) with optional caption + inline keyboard.
export const tgSendPhotoBase64 = async (
  chatId: string | number,
  base64: string,
  caption: string,
  replyMarkup?: unknown,
) => {
  ensureBot();
  const buffer = Buffer.from(base64, 'base64');
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption);
  form.append('parse_mode', 'HTML');
  if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));
  form.append('photo', new Blob([buffer]), 'photo.jpg');

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
    method: 'POST',
    body: form as any,
  });
  const json: any = await res.json();
  if (!json?.ok) {
    throw new Error(`Telegram sendPhoto failed: ${json?.description || res.status}`);
  }
  return json.result;
};

// Download a file the user sent to the bot, return base64.
export const tgDownloadFileAsBase64 = async (fileId: string): Promise<{ base64: string; mimeType: string }> => {
  ensureBot();
  const fileInfo: any = await callJson('getFile', { file_id: fileId });
  const filePath: string = fileInfo.file_path;
  const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`TG file download failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const ext = (filePath.split('.').pop() || 'jpg').toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
  return { base64, mimeType };
};
