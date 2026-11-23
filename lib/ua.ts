/** Small user-agent parser: enough detail for the admin, no dependency. */
export type UaInfo = {
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string; bv?: string;
  os: string; osv?: string;
  model?: string;
  app?: string;
};

const m = (ua: string, re: RegExp) => ua.match(re)?.[1];

export function parseUa(ua: string): UaInfo {
  const device: UaInfo['device'] = /ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua)) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop';

  let browser = 'Other'; let bv: string | undefined;
  const rules: [string, RegExp][] = [
    ['Edge', /edg(?:e|a|ios)?\/([\d]+)/i], ['Opera', /(?:opr|opera)\/([\d]+)/i], ['Yandex', /yabrowser\/([\d]+)/i],
    ['Samsung Internet', /samsungbrowser\/([\d]+)/i], ['Firefox', /(?:firefox|fxios)\/([\d]+)/i], ['Chrome', /(?:chrome|crios)\/([\d]+)/i],
    ['Safari', /version\/([\d.]+).*safari/i],
  ];
  for (const [name, re] of rules) { const v = m(ua, re); if (v) { browser = name; bv = v; break; } }
  if (browser === 'Other' && /safari/i.test(ua)) browser = 'Safari';

  let os = 'Other'; let osv: string | undefined;
  if (/iphone|ipad|ipod/i.test(ua)) { os = /ipad/i.test(ua) ? 'iPadOS' : 'iOS'; osv = m(ua, /os (\d+[_\d]*)/i)?.replace(/_/g, '.'); }
  else if (/android/i.test(ua)) { os = 'Android'; osv = m(ua, /android ([\d.]+)/i); }
  else if (/windows nt/i.test(ua)) { os = 'Windows'; const v = m(ua, /windows nt ([\d.]+)/i); osv = v === '10.0' ? '10/11' : v === '6.3' ? '8.1' : v === '6.1' ? '7' : v; }
  else if (/cros/i.test(ua)) os = 'ChromeOS';
  else if (/mac os x/i.test(ua)) os = 'macOS'; // browsers freeze this at 10.15.7, so no version
  else if (/linux/i.test(ua)) os = 'Linux';

  let model: string | undefined;
  if (/iphone/i.test(ua)) model = 'iPhone';
  else if (/ipad/i.test(ua)) model = 'iPad';
  else if (os === 'macOS') model = 'Mac';
  else if (os === 'Android') {
    const raw = m(ua, /android [\d.]+;(?: [a-z]{2}[-_][a-z]{2};)? ([^;)]+?)(?: build|\))/i)?.trim();
    if (raw && raw !== 'K' && !/^wv$/i.test(raw)) model = raw.slice(0, 40);
  }

  let app: string | undefined;
  if (/telegram/i.test(ua)) app = 'Telegram';
  else if (/instagram/i.test(ua)) app = 'Instagram';
  else if (/fban|fbav/i.test(ua)) app = 'Facebook';
  else if (/linkedinapp/i.test(ua)) app = 'LinkedIn';
  else if (/\bline\//i.test(ua)) app = 'LINE';

  if (browser === 'Other' && app) browser = 'In-app browser';
  return {device, browser, bv, os, osv, model, app};
}
