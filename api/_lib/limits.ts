// Spend guards for the automatic generation path.
//
// Every auto-generation costs real money, so two counters live in KV:
//   - per visitor IP, per day  — stops one person from burning the budget
//   - global, per day          — caps the worst case for the whole site
//
// These replace the old localStorage counter, which any visitor could reset by
// clearing their browser. Hitting a limit is not an error: the caller falls
// back to the manual Telegram flow, so the visitor still gets a photo.

import { kvIncr } from './kv.js';

const DAY_SECONDS = 60 * 60 * 24;

const numFromEnv = (name: string, fallback: number) => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
};

export const perIpDailyLimit = () => numFromEnv('AUTO_GEN_IP_DAILY_LIMIT', 3);
export const globalDailyLimit = () => numFromEnv('AUTO_GEN_DAILY_LIMIT', 25);

// Vercel puts the visitor IP in x-forwarded-for (may be a comma-separated chain;
// the first entry is the client).
export const clientIp = (req: any): string => {
  const header = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '';
  const raw = Array.isArray(header) ? header[0] : String(header);
  const first = raw.split(',')[0]?.trim();
  return first || 'unknown-ip';
};

const today = () => new Date().toISOString().slice(0, 10);

export type LimitVerdict =
  | { allowed: true; ipCount: number; globalCount: number }
  | { allowed: false; reason: 'ip' | 'global' | 'kv-error'; detail: string };

/**
 * Reserve one auto-generation slot. Counters are incremented up front: it is
 * better to occasionally lose a slot to a failed generation than to let a
 * retry loop spend money without bound.
 */
export const reserveAutoGeneration = async (ip: string): Promise<LimitVerdict> => {
  const day = today();

  try {
    const globalCount = await kvIncr(`lim:auto:global:${day}`, DAY_SECONDS);
    if (globalCount > globalDailyLimit()) {
      return {
        allowed: false,
        reason: 'global',
        detail: `Дневной лимит автогенераций исчерпан (${globalDailyLimit()}).`,
      };
    }

    const ipCount = await kvIncr(`lim:auto:ip:${ip}:${day}`, DAY_SECONDS);
    if (ipCount > perIpDailyLimit()) {
      return {
        allowed: false,
        reason: 'ip',
        detail: `С этого IP сегодня уже ${perIpDailyLimit()} автогенераций.`,
      };
    }

    return { allowed: true, ipCount, globalCount };
  } catch (error) {
    // KV is down. Refuse the paid path rather than spending blind — the manual
    // flow still covers the visitor.
    return {
      allowed: false,
      reason: 'kv-error',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};
