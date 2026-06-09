// One-shot setup endpoint: register our /api/telegram-webhook URL with Telegram
// using the bot token from env vars. Open this in a browser once after the
// first deploy. Safe to call repeatedly — Telegram just overwrites the URL.

export default async function handler(req: any, res: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN не задан в env.' });
    return;
  }

  // Determine our own public URL. Vercel exposes VERCEL_URL but it's the
  // deployment-specific host; we want the canonical one.
  const host =
    req.headers['x-forwarded-host'] ||
    req.headers.host ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'cv-akbar.vercel.app';
  const webhookUrl = `https://${host}/api/telegram-webhook`;

  try {
    const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message', 'callback_query'],
        drop_pending_updates: true,
      }),
    });
    const setJson = await setRes.json();

    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const infoJson = await infoRes.json();

    res.status(200).json({
      requestedUrl: webhookUrl,
      setWebhook: setJson,
      currentInfo: infoJson?.result || infoJson,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
