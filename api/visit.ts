// Pings Telegram when someone opens the site.
//
// Two things this deliberately does NOT do:
//  - report the visitor's IP. Country and city answer "who is looking" just as
//    well without putting a personal identifier in a chat log; the address is
//    only hashed, to tell one visitor from another.
//  - fire on every single request. A refresh, a bot sweep or a stranger curling
//    this endpoint would otherwise flood the bot, so repeats from the same
//    visitor are quiet for a few minutes and the whole site has an hourly cap.

import { kvGet, kvSet, kvIncr } from './_lib/kv.js';
import { adminChatId, tgSendMessage } from './_lib/telegram.js';
import { clientIp } from './_lib/limits.js';
import { createHash } from 'node:crypto';

const REPEAT_QUIET_SECONDS = 5 * 60;   // same visitor: no second message for 5 min
const HOURLY_MESSAGE_CAP = 40;         // hard stop on notification storms
const DAY_SECONDS = 60 * 60 * 24;

const enabled = () => process.env.VISIT_NOTIFICATIONS !== '0';

const header = (req: any, name: string): string => {
  const raw = req.headers?.[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value : '';
};

// Crawlers open far more pages than people do, and none of them are a lead.
const BOT_PATTERN = /bot|crawler|spider|crawling|preview|facebookexternalhit|slurp|bingpreview|headless|lighthouse|monitoring|uptime|curl|wget|python-requests|axios|postman/i;

const describeDevice = (ua: string): string => {
  if (!ua) return 'неизвестное устройство';
  const os = /iphone|ipad|ipod/i.test(ua) ? 'iPhone/iPad'
    : /android/i.test(ua) ? 'Android'
    : /mac os x/i.test(ua) ? 'Mac'
    : /windows/i.test(ua) ? 'Windows'
    : /linux/i.test(ua) ? 'Linux'
    : 'другое';
  const browser = /edg\//i.test(ua) ? 'Edge'
    : /opr\/|opera/i.test(ua) ? 'Opera'
    : /chrome|crios/i.test(ua) ? 'Chrome'
    : /firefox|fxios/i.test(ua) ? 'Firefox'
    : /safari/i.test(ua) ? 'Safari'
    : 'браузер';
  return `${os} · ${browser}`;
};

const describeSource = (referrer: string): string => {
  if (!referrer) return 'прямой заход';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host.includes('t.me') || host.includes('telegram')) return 'Telegram';
    if (host.includes('hh.ru') || host.includes('headhunter')) return 'hh.ru';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('google')) return 'поиск Google';
    if (host.includes('yandex')) return 'поиск Яндекс';
    if (host.includes('github')) return 'GitHub';
    return host;
  } catch {
    return 'прямой заход';
  }
};

export default async function handler(req: any, res: any) {
  // Always answer 204 quickly: this is a beacon, and the page must not wait on
  // it or care whether it worked.
  res.status(204).end();

  if (!enabled() || req.method !== 'POST') return;

  try {
    const ua = header(req, 'user-agent');
    if (BOT_PATTERN.test(ua)) return;

    const ip = clientIp(req);
    const visitor = createHash('sha256').update(`visit:${ip}`).digest('hex').slice(0, 8);

    // Quiet window for this visitor.
    const seenKey = `visit:seen:${visitor}`;
    if (await kvGet(seenKey)) return;
    await kvSet(seenKey, { at: Date.now() }, REPEAT_QUIET_SECONDS);

    const day = new Date().toISOString().slice(0, 10);
    const hour = new Date().toISOString().slice(0, 13);

    // Storm guard — counted before the daily total so a flood cannot inflate it.
    const sentThisHour = await kvIncr(`visit:sent:${hour}`, 60 * 60);
    if (sentThisHour > HOURLY_MESSAGE_CAP) return;

    const todayCount = await kvIncr(`visit:count:${day}`, DAY_SECONDS);
    const isReturning = !!(await kvGet(`visit:known:${visitor}`));
    await kvSet(`visit:known:${visitor}`, { at: Date.now() }, 30 * DAY_SECONDS);

    const city = header(req, 'x-vercel-ip-city');
    const country = header(req, 'x-vercel-ip-country');
    const place = [city ? decodeURIComponent(city) : '', country].filter(Boolean).join(', ') || 'место неизвестно';
    const time = new Date().toLocaleTimeString('ru-RU', { timeZone: 'Europe/Kaliningrad', hour: '2-digit', minute: '2-digit' });

    await tgSendMessage(
      adminChatId(),
      `👀 <b>Заход на сайт</b> — ${time}\n\n`
      + `📍 ${place}\n`
      + `📱 ${describeDevice(ua)}\n`
      + `🔗 ${describeSource(header(req, 'referer'))}\n`
      + `${isReturning ? '🔁 уже заходил раньше' : '🆕 впервые'}\n\n`
      + `Сегодня заходов: <b>${todayCount}</b>`,
    );
  } catch (error) {
    // A missed notification must never surface anywhere.
    console.warn('[visit] notification failed:', error);
  }
}
