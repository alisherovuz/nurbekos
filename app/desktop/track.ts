type TrackType = 'view' | 'open' | 'click' | 'game' | 'leave';

const rand = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

/** A random visitor id in a first-party cookie, so the server routes (CV, contact) see it too. */
function ensureVisitorId() {
  try {
    if (/(?:^|; )nos_vid=/.test(document.cookie)) return;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `nos_vid=${rand()}; Path=/; Max-Age=${60 * 60 * 24 * 400}; SameSite=Lax${secure}`;
  } catch { /* ignore */ }
}

/** One visit = until 30 minutes of nothing. */
function sessionId() {
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem('nos_sid');
    const saved = raw ? (JSON.parse(raw) as {id: string; at: number}) : null;
    const id = saved && now - saved.at < 30 * 60e3 ? saved.id : rand();
    sessionStorage.setItem('nos_sid', JSON.stringify({id, at: now}));
    return id;
  } catch {
    return undefined;
  }
}

function send(body: Record<string, unknown>) {
  const json = JSON.stringify(body);
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) navigator.sendBeacon('/api/track', json);
  else void fetch('/api/track', {method: 'POST', body: json, keepalive: true});
}

let activeSince = 0;
let activeMs = 0;
let watching = false;

function watchActiveTime() {
  if (watching || typeof document === 'undefined') return;
  watching = true;
  activeSince = document.visibilityState === 'visible' ? Date.now() : 0;
  const flush = () => {
    if (activeSince) { activeMs += Date.now() - activeSince; activeSince = 0; }
    if (activeMs > 1000) { send({type: 'leave', s: sessionId(), ms: activeMs}); activeMs = 0; }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else activeSince = Date.now();
  });
  window.addEventListener('pagehide', flush);
}

/** Fire-and-forget analytics. Never throws, never blocks the UI. */
export function track(type: TrackType, data: {path?: string; target?: string; ref?: string} = {}) {
  try {
    ensureVisitorId();
    watchActiveTime();
    const body: Record<string, unknown> = {type, s: sessionId(), ...data};
    if (type === 'view') {
      body.screen = `${window.screen.width}x${window.screen.height}`;
      try { body.tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* ignore */ }
    }
    send(body);
  } catch { /* ignore */ }
}
