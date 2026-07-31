// Diagnostics for the Telegram webhook: is it registered, is delivery failing?
// pending_update_count > 0 means Telegram is buffering because our webhook errors.
//
//   https://cv-akbar.vercel.app/api/webhook-info?secret=<WEBHOOK_SECRET>
//
// Admin-only, and it no longer echoes env values back: the previous version
// returned TELEGRAM_ADMIN_CHAT_ID to anyone who opened the URL, which is the
// one piece an attacker needs to impersonate the admin in a forged update.

import { requireAdminSecret } from './_lib/guard.js';

export default async function handler(req: any, res: any) {
  if (!requireAdminSecret(req, res)) return;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN не задан в env.' });
    return;
  }

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const json: any = await r.json();
    const info = json?.result || {};

    res.status(200).json({
      url: info.url || null,
      pendingUpdateCount: info.pending_update_count ?? null,
      lastError: info.last_error_message
        ? {
            message: info.last_error_message,
            at: info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : null,
          }
        : null,
      hint: info.url
        ? (info.last_error_message
            ? `Webhook есть, но последняя доставка упала: "${info.last_error_message}". Pending: ${info.pending_update_count}.`
            : `Webhook зарегистрирован. Pending updates: ${info.pending_update_count}.`)
        : 'Webhook НЕ зарегистрирован — открой /api/setup-webhook?secret=...',
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
