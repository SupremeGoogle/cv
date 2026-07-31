// Quick health check: which env vars are visible and whether KV+Telegram answer.
// GET /api/health → JSON with all the diagnostic data we need to debug setup.

import { kvEnvStatus, kvGet, kvSet, kvDel } from './_lib/kv.js';
import { deepinfraEnvStatus } from './_lib/deepinfra.js';
import { globalDailyLimit, perIpDailyLimit } from './_lib/limits.js';

export default async function handler(_req: any, res: any) {
  const envs = {
    DEEPINFRA_TOKEN: !!process.env.DEEPINFRA_TOKEN,
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_ADMIN_CHAT_ID: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    REDIS_URL: !!process.env.REDIS_URL,
    REDIS_TOKEN: !!process.env.REDIS_TOKEN,
  };

  // KV roundtrip: set → get → del with a dummy key.
  let kvCheck: any = { ok: false };
  try {
    const probe = `health:${Date.now()}`;
    await kvSet(probe, { hi: 'world' }, 60);
    const back = await kvGet(probe);
    await kvDel(probe);
    kvCheck = { ok: true, roundtrip: back };
  } catch (error) {
    // Node wraps connection problems as a bare "fetch failed"; the cause code
    // (ENOTFOUND, ECONNREFUSED, CERT_*) is what actually names the problem.
    const cause: any = (error as any)?.cause;
    kvCheck = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      causeCode: cause?.code || cause?.name || null,
      causeMessage: typeof cause?.message === 'string' ? cause.message.slice(0, 200) : null,
    };
  }

  // Telegram getMe — verifies the token without spamming the admin chat.
  let telegramCheck: any = { ok: false };
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    telegramCheck = { ok: false, error: 'TELEGRAM_BOT_TOKEN не задан' };
  } else {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const json = await r.json();
      telegramCheck = json?.ok
        ? { ok: true, botUsername: json.result?.username }
        : { ok: false, error: json?.description || `HTTP ${r.status}` };
    } catch (error) {
      telegramCheck = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  res.status(200).json({
    env: envs,
    kvSource: kvEnvStatus(),
    kv: kvCheck,
    telegram: telegramCheck,
    adminChatIdSet: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    autoGeneration: {
      ...deepinfraEnvStatus(),
      perIpDailyLimit: perIpDailyLimit(),
      globalDailyLimit: globalDailyLimit(),
    },
  });
}
