// One-shot setup endpoint: register our /api/telegram-webhook URL with Telegram.
// Open it once after a deploy (or after changing WEBHOOK_SECRET):
//   https://cv-akbar.vercel.app/api/setup-webhook?secret=<WEBHOOK_SECRET>
//
// Two things this must never do, both of which it used to:
//  - run for anyone who knows the URL,
//  - take the webhook host from request headers. `Host`/`x-forwarded-host` are
//    attacker-controlled, so that let a stranger point the bot's webhook at
//    their own server and receive every update, including visitors' photos.

import { requireAdminSecret, webhookSecret } from './_lib/guard.js';

// The canonical production host. Override with PUBLIC_HOST if the domain changes.
const publicHost = () => process.env.PUBLIC_HOST || 'cv-akbar.vercel.app';

export default async function handler(req: any, res: any) {
  if (!requireAdminSecret(req, res)) return;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN не задан в env.' });
    return;
  }

  const webhookUrl = `https://${publicHost()}/api/telegram-webhook`;

  try {
    const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message', 'callback_query'],
        drop_pending_updates: true,
        // Telegram echoes this back in x-telegram-bot-api-secret-token, which is
        // how /api/telegram-webhook can tell a real update from a forged one.
        secret_token: webhookSecret(),
      }),
    });
    const setJson: any = await setRes.json();

    res.status(200).json({
      requestedUrl: webhookUrl,
      ok: !!setJson?.ok,
      description: setJson?.description || null,
      secretTokenSent: true,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
