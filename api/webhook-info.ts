// Show what Telegram thinks of our webhook: is it registered? Any delivery errors?
// pending_update_count > 0 means Telegram is buffering updates because the webhook is failing.

export default async function handler(_req: any, res: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN не задан в env.' });
    return;
  }

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const json: any = await r.json();
    res.status(200).json({
      raw: json,
      adminChatIdFromEnv: process.env.TELEGRAM_ADMIN_CHAT_ID || null,
      hint:
        json?.result?.url
          ? (json.result.last_error_message
              ? `Webhook есть, НО последняя доставка упала: "${json.result.last_error_message}" (${json.result.last_error_date ? new Date(json.result.last_error_date * 1000).toISOString() : '?'}). Pending: ${json.result.pending_update_count}.`
              : `Webhook зарегистрирован: ${json.result.url}. Pending updates: ${json.result.pending_update_count}.`)
          : 'Webhook НЕ зарегистрирован — открой /api/setup-webhook.',
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
