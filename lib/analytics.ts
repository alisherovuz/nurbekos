import crypto from 'crypto';
import {promises as fs} from 'fs';
import {appendLine, clientIp, dataPath, localSecret, readLines} from './store';
import {lookupGeo} from './geo';
import {parseUa} from './ua';

export type EventType = 'view' | 'open' | 'click' | 'cv' | 'contact' | 'game' | 'leave';

export type EventRecord = {
  t: number;
  type: EventType;
  path?: string;
  target?: string;
  ref?: string;
  /** Visitor id: a random id kept in the visitor's browser (older rows: a daily hash). */
  v: string;
  /** Session id: one visit, ends after 30 minutes of nothing. */
  s?: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  bv?: string;
  os: string;
  osv?: string;
  model?: string;
  app?: string;
  country?: string;
  countryName?: string;
  region?: string;
  city?: string;
  isp?: string;
  lang?: string;
  langs?: string;
  screen?: string;
  tz?: string;
  /** Active time in ms, sent with 'leave'. */
  ms?: number;
};

// Link-preview fetchers and crawlers. Telegram/WhatsApp in-app browsers are real people, so only the bots are listed.
const BOT = /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp\/|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|scrapy|httpclient|preview/i;

export function isBot(ua: string) {
  return !ua || BOT.test(ua);
}

function day(ts = Date.now()) {
  // Days follow Tashkent time (UTC+5) so "today" matches the owner's day.
  return new Date(ts + 5 * 3600e3).toISOString().slice(0, 10);
}

function headerCountry(req: Request) {
  for (const h of ['cf-ipcountry', 'x-vercel-ip-country', 'x-country-code', 'x-geo-country', 'x-livops-country']) {
    const value = req.headers.get(h);
    if (value && /^[a-z]{2}$/i.test(value) && value.toUpperCase() !== 'XX') return value.toUpperCase();
  }
  return undefined;
}

function cookie(req: Request, name: string) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
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
const ID = /^[a-z0-9]{8,32}$/i;

export type EventInput = {type: EventType; path?: unknown; target?: unknown; ref?: unknown; s?: unknown; screen?: unknown; tz?: unknown; ms?: unknown};

export async function recordEvent(req: Request, input: EventInput) {
  const ua = req.headers.get('user-agent') || '';
  if (isBot(ua)) return false;
  const today = day();
  const ip = clientIp(req);
  const stored = cookie(req, 'nos_vid');
  let v: string;
  if (stored && ID.test(stored)) v = stored;
  else {
    // No id yet (first hit, or cookies blocked): fall back to a daily one-way hash.
    const salt = await localSecret('analytics-salt');
    v = crypto.createHash('sha256').update(`${salt}|${today}|${ip}|${ua}`).digest('base64url').slice(0, 16);
  }
  const langHeader = req.headers.get('accept-language') || '';
  const langs = langHeader.split(',').map(x => x.split(';')[0].trim()).filter(Boolean).slice(0, 4).join(', ');
  const lang = langs.split(',')[0]?.split('-')[0]?.toLowerCase() || undefined;
  const info = parseUa(ua);
  const geo = await lookupGeo(ip);
  const s = clip(input.s, 32);
  const screen = clip(input.screen, 20);
  const ms = typeof input.ms === 'number' && input.ms > 0 ? Math.min(Math.round(input.ms), 6 * 3600e3) : undefined;
  const record: EventRecord = {
    t: Date.now(),
    type: input.type,
    path: clip(input.path, 120),
    target: clip(input.target, 160),
    ref: cleanRef(clip(input.ref, 300), req.headers.get('host')),
    v,
    s: s && ID.test(s) ? s : undefined,
    ...info,
    country: geo.cc || headerCountry(req),
    countryName: geo.country,
    region: geo.region,
    city: geo.city,
    isp: geo.isp,
    lang: lang && /^[a-z]{2,3}$/.test(lang) ? lang : undefined,
    langs: langs.slice(0, 80) || undefined,
    screen: screen && /^\d{2,5}x\d{2,5}$/.test(screen) ? screen : undefined,
    tz: clip(input.tz, 40),
    ms,
  };
  for (const k of Object.keys(record) as (keyof EventRecord)[]) if (record[k] === undefined) delete record[k];
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
  const cities = new Map<string, number>();
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
      bump(browsers, e.app ? `${e.browser} (in ${e.app})` : e.browser);
      bump(systems, e.os);
      bump(countries, e.countryName || e.country);
      bump(cities, e.city ? `${e.city}${e.countryName ? `, ${e.countryName}` : ''}` : undefined);
      bump(languages, e.lang);
    }
  }

  const recent = all.filter(e => e.type !== 'leave').slice(-40).reverse().map(e => ({
    t: e.t, type: e.type, path: e.path, target: e.target, ref: e.ref, device: e.device, country: e.country, city: e.city, v: e.v,
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
    cities: top(cities),
    languages: top(languages),
    clicks: top(clicks, 10),
    recent,
  };
}

export type Stats = Awaited<ReturnType<typeof getStats>>;

/** Deletes all recorded visits and events. Messages are kept. */
export async function resetStats() {
  await fs.rm(dataPath('events'), {recursive: true, force: true});
}

/* ───────────── Per-visitor view ───────────── */

export type VisitorSummary = {
  v: string;
  first: number;
  last: number;
  visits: number;
  views: number;
  opens: number;
  clicks: number;
  cv: number;
  messages: number;
  activeMs: number;
  landing?: string;
  ref?: string;
  country?: string; countryName?: string; region?: string; city?: string; isp?: string;
  device: string; browser: string; bv?: string; os: string; osv?: string; model?: string; app?: string;
  lang?: string; langs?: string; screen?: string; tz?: string;
  windows: string[];
};

export type VisitorSession = {id: string; start: number; end: number; activeMs: number; ref?: string; events: {t: number; type: EventType; path?: string; target?: string}[]};

const GAP = 30 * 60e3;

async function readDays(days: number) {
  const now = Date.now();
  const keys = Array.from({length: days}, (_, i) => day(now - (days - 1 - i) * 864e5));
  return (await Promise.all(keys.map(d => readLines<EventRecord>(`events/${d}.jsonl`)))).flat();
}

function splitSessions(events: EventRecord[]): VisitorSession[] {
  const sessions: VisitorSession[] = [];
  const byId = new Map<string, VisitorSession>();
  let latest: VisitorSession | undefined;
  for (const e of events) {
    let session: VisitorSession | undefined;
    if (e.s) session = byId.get(e.s);
    // Server-side events (CV, contact) and old rows have no session id: join the visit they happened in.
    else if (latest && e.t - latest.end < GAP) session = latest;
    if (!session) {
      session = {id: e.s || `a${e.t}`, start: e.t, end: e.t, activeMs: 0, events: []};
      sessions.push(session);
      if (e.s) byId.set(e.s, session);
    }
    latest = session;
    session.end = Math.max(session.end, e.t);
    if (!session.ref && e.ref) session.ref = e.ref;
    if (e.type === 'leave') session.activeMs += e.ms || 0;
    else session.events.push({t: e.t, type: e.type, path: e.path, target: e.target});
  }
  // Sessions with no 'leave' (old data, closed tab on some phones): use first → last event.
  for (const s of sessions) if (!s.activeMs) s.activeMs = s.end - s.start;
  return sessions;
}

function summarize(v: string, events: EventRecord[]): VisitorSummary {
  const sessions = splitSessions(events);
  const latest = [...events].reverse();
  const pick = <K extends keyof EventRecord>(k: K) => latest.find(e => e[k] !== undefined && e[k] !== '')?.[k];
  const firstView = events.find(e => e.type === 'view');
  const windows = [...new Set(events.filter(e => e.type === 'open' && e.path).map(e => e.path!))];
  return {
    v,
    first: events[0].t,
    last: events[events.length - 1].t,
    visits: sessions.length,
    views: events.filter(e => e.type === 'view').length,
    opens: events.filter(e => e.type === 'open').length,
    clicks: events.filter(e => e.type === 'click').length,
    cv: events.filter(e => e.type === 'cv').length,
    messages: events.filter(e => e.type === 'contact').length,
    activeMs: sessions.reduce((a, s) => a + s.activeMs, 0),
    landing: firstView?.path,
    ref: events.find(e => e.ref)?.ref,
    country: pick('country') as string | undefined,
    countryName: pick('countryName') as string | undefined,
    region: pick('region') as string | undefined,
    city: pick('city') as string | undefined,
    isp: pick('isp') as string | undefined,
    device: latest[0].device,
    browser: latest[0].browser,
    bv: pick('bv') as string | undefined,
    os: latest[0].os,
    osv: pick('osv') as string | undefined,
    model: pick('model') as string | undefined,
    app: pick('app') as string | undefined,
    lang: pick('lang') as string | undefined,
    langs: pick('langs') as string | undefined,
    screen: pick('screen') as string | undefined,
    tz: pick('tz') as string | undefined,
    windows,
  };
}

function groupByVisitor(all: EventRecord[]) {
  const map = new Map<string, EventRecord[]>();
  for (const e of all) {
    const list = map.get(e.v);
    if (list) list.push(e); else map.set(e.v, [e]);
  }
  for (const list of map.values()) list.sort((a, b) => a.t - b.t);
  return map;
}

export async function getVisitors(days = 30) {
  const map = groupByVisitor(await readDays(days));
  const visitors = [...map.entries()].map(([v, events]) => summarize(v, events)).sort((a, b) => b.last - a.last);
  return {visitors: visitors.slice(0, 1000), total: visitors.length, returning: visitors.filter(x => x.visits > 1).length};
}

export async function getVisitor(v: string, days = 90) {
  const all = await readDays(days);
  const events = all.filter(e => e.v === v).sort((a, b) => a.t - b.t);
  if (!events.length) return null;
  return {visitor: summarize(v, events), sessions: splitSessions(events).reverse()};
}
