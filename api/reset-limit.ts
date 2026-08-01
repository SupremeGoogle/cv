// Clears today's generation counters so testing is not blocked until midnight.
//
//   /api/reset-limit?secret=<WEBHOOK_SECRET>          — the caller's own IP
//   /api/reset-limit?secret=...&scope=global          — the site-wide counter too
//
// Admin-only: the counters are what stand between the DeepInfra balance and a
// stranger with a loop.

import { kvDel } from './_lib/kv.js';
import { requireAdminSecret } from './_lib/guard.js';
import { clientIp, limitKeys, perIpDailyLimit, globalDailyLimit } from './_lib/limits.js';

export default async function handler(req: any, res: any) {
  if (!requireAdminSecret(req, res)) return;

  const ip = clientIp(req);
  const keys = limitKeys(ip);
  const alsoGlobal = req.query?.scope === 'global';

  try {
    await kvDel(keys.ip);
    if (alsoGlobal) await kvDel(keys.global);

    res.status(200).json({
      ok: true,
      clearedIp: ip,
      clearedGlobal: alsoGlobal,
      limits: { perIp: perIpDailyLimit(), global: globalDailyLimit() },
      hint: alsoGlobal
        ? 'Счётчики этого IP и общий дневной сброшены.'
        : 'Счётчик этого IP сброшен. Для общего добавьте &scope=global.',
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
