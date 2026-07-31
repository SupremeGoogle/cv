// Access guard for the admin-only maintenance endpoints, and the shared secret
// Telegram echoes back on every webhook delivery.
//
// Why this exists: /api/setup-webhook can re-point the bot's webhook and
// /api/telegram-webhook drives the whole request flow. Both were reachable by
// anyone who knew the URL.

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

export const webhookSecret = () => WEBHOOK_SECRET;
export const hasWebhookSecret = () => !!WEBHOOK_SECRET;

// Constant-time-ish compare. Node's timingSafeEqual needs equal lengths, and
// leaking the length of a secret is not a concern worth the extra branches here.
const sameSecret = (given: string) => {
  if (!WEBHOOK_SECRET || given.length !== WEBHOOK_SECRET.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ WEBHOOK_SECRET.charCodeAt(i);
  return diff === 0;
};

/**
 * Gate for maintenance endpoints. The secret may come from `?secret=` or the
 * `x-admin-secret` header. Returns true when the caller may proceed; otherwise
 * it has already written the response.
 */
export const requireAdminSecret = (req: any, res: any): boolean => {
  if (!WEBHOOK_SECRET) {
    res.status(503).json({
      error: 'WEBHOOK_SECRET не задан в переменных окружения. Задайте его в Vercel, ' +
        'иначе служебные эндпоинты остаются выключенными.',
    });
    return false;
  }

  const fromQuery = typeof req.query?.secret === 'string' ? req.query.secret : '';
  const headerRaw = req.headers?.['x-admin-secret'];
  const fromHeader = Array.isArray(headerRaw) ? headerRaw[0] : (headerRaw || '');
  const given = String(fromQuery || fromHeader || '');

  if (!sameSecret(given)) {
    res.status(404).json({ error: 'Not found' }); // don't confirm the endpoint exists
    return false;
  }
  return true;
};

/**
 * Telegram sends the secret configured via setWebhook back in this header on
 * every delivery, which is what proves an update really came from Telegram.
 * Without it anyone could POST a forged update and drive the bot.
 */
export const isFromTelegram = (req: any): boolean => {
  if (!WEBHOOK_SECRET) return true; // not configured yet — don't break a running bot
  const raw = req.headers?.['x-telegram-bot-api-secret-token'];
  const given = Array.isArray(raw) ? raw[0] : (raw || '');
  return sameSecret(String(given));
};
