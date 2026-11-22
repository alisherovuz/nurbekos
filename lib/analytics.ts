import crypto from 'crypto';
import {appendLine, clientIp, localSecret, readLines} from './store';

export type EventType = 'view' | 'open' | 'click' | 'cv' | 'contact' | 'game';

export type EventRecord = {
  t: number;
  type: EventType;
  path?: string;
  target?: string;
  ref?: string;
  v: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  country?: string;
  lang?: string;
};

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|telegram|whatsapp|discord|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http/i;

export function isBot(ua: string) {
  return !ua || BOT.test(ua);
}

function day(ts = Date.now()) {
  // Days follow Tashkent time (UTC+5) so "today" matches the owner's day.
  return new Date(ts + 5 * 3600e3).toISOString().slice(0, 10);
}

function device(ua: string): EventRecord['device'] {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function browser(ua: string) {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/yabrowser/i.test(ua)) return 'Yandex';
  if (/samsungbrowser/i.test(ua)) return 'Samsung';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

function os(ua: string) {
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

function country(req: Request) {
  for (const h of ['cf-ipcountry', 'x-vercel-ip-country', 'x-country-code', 'x-geo-country', 'x-livops-country']) {
    const value = req.headers.get(h);
    if (value && /^[a-z]{2}$/i.test(value)) return value.toUpperCase();
  }
  return undefined;
}

function cleanRef(ref: string | undefined, host: string | null) {
  if (!ref) return undefined;
  try {
    const url = new URL(ref);
    const h = url.hostname.replace(/^www\./, '');
    if (host && h === host.replace(/^www\./, '').split(':')[0]) return undefined;
    if (h === 'alisherov.com' || h.endsWith('.livops.app') || h === 'localhost') return undefined;
    return h.slice(0, 80);
  } catch {
    return undefined;
  }
}

function clip(value: unknown, max: number) {
  return typeof value === 'string' && value ? value.slice(0, max) : undefined;
}

export async function recordEvent(req: Request, input: {type: EventType; path?: unknown; target?: unknown; ref?: unknown}) {
  const ua = req.headers.get('user-agent') || '';
  if (isBot(ua)) return false;
  const salt = await localSecret('analytics-salt');
  const today = day();
  // A daily-rotating, one-way visitor id: no cookies, no raw IPs stored.
  const v = crypto.createHash('sha256').update(`${salt}|${today}|${clientIp(req)}|${ua}`).digest('base64url').slice(0, 16);
  const lang = (req.headers.get('accept-language') || '').split(',')[0]?.split('-')[0]?.toLowerCase() || undefined;
  const record: EventRecord = {
    t: Date.now(),
    type: input.type,
    path: clip(input.path, 120),
    target: clip(input.target, 160),
    ref: cleanRef(clip(input.ref, 300), req.headers.get('host')),
    v,
    device: device(ua),
    browser: browser(ua),
    os: os(ua),
    country: country(req),
    lang: lang && /^[a-z]{2,3}$/.test(lang) ? lang : undefined,
  };
  await appendLine(`events/${today}.jsonl`, record);
  return true;
}

type Count = {key: string; count: number};
function top(map: Map<string, number>, n = 8): Count[] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({key, count}));
}
function bump(map: Map<string, number>, key: string | undefined, by = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + by);
}

export async function getStats(days = 30) {
  const now = Date.now();
  const dayKeys = Array.from({length: days}, (_, i) => day(now - (days - 1 - i) * 864e5));
  const perDay = await Promise.all(dayKeys.map(d => readLines<EventRecord>(`events/${d}.jsonl`)));

  const series = dayKeys.map((date, i) => {
    const events = perDay[i];
    return {
      date,
      visitors: new Set(events.map(e => e.v)).size,
      views: events.filter(e => e.type === 'view').length,
      opens: events.filter(e => e.type === 'open').length,
    };
  });

  const all = perDay.flat();
  const windowed = (n: number) => perDay.slice(-n).flat();
  const summary = (events: EventRecord[]) => ({
    visitors: new Set(events.map(e => `${e.v}`)).size,
    views: events.filter(e => e.type === 'view').length,
    opens: events.filter(e => e.type === 'open').length,
    cv: events.filter(e => e.type === 'cv').length,
    messages: events.filter(e => e.type === 'contact').length,
  });

  const pages = new Map<string, number>();
  const windows = new Map<string, number>();
  const referrers = new Map<string, number>();
  const devices = new Map<string, number>();
  const browsers = new Map<string, number>();
  const systems = new Map<string, number>();
  const countries = new Map<string, number>();
  const languages = new Map<string, number>();
  const clicks = new Map<string, number>();
  const hours = Array.from({length: 24}, () => 0);
  const seenVisitor = new Set<string>();

  for (const e of all) {
    if (e.type === 'view') {
      bump(pages, e.path || '/');
      bump(referrers, e.ref || 'Direct / unknown');
      hours[new Date(e.t + 5 * 3600e3).getUTCHours()] += 1;
    }
    if (e.type === 'open') bump(windows, e.path);
    if (e.type === 'click' || e.type === 'cv') bump(clicks, e.type === 'cv' ? 'CV download' : e.target);
    if (!seenVisitor.has(e.v)) {
      seenVisitor.add(e.v);
      bump(devices, e.device);
      bump(browsers, e.browser);
      bump(systems, e.os);
      bump(countries, e.country);
      bump(languages, e.lang);
    }
  }

  const recent = all.slice(-40).reverse().map(e => ({
    t: e.t, type: e.type, path: e.path, target: e.target, ref: e.ref, device: e.device, country: e.country,
  }));

  const liveCutoff = now - 5 * 60e3;
  const live = new Set(all.filter(e => e.t >= liveCutoff).map(e => e.v)).size;

  return {
    generatedAt: now,
    live,
    today: summary(windowed(1)),
    week: summary(windowed(7)),
    month: summary(all),
    series,
    hours,
    topPages: top(pages),
    topWindows: top(windows, 10),
    referrers: top(referrers),
    devices: top(devices),
    browsers: top(browsers),
    systems: top(systems),
    countries: top(countries),
    languages: top(languages),
    clicks: top(clicks, 10),
    recent,
  };
}

export type Stats = Awaited<ReturnType<typeof getStats>>;
