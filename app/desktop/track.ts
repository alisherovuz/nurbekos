type TrackType = 'view' | 'open' | 'click' | 'game';

/** Fire-and-forget analytics. Never throws, never blocks the UI. */
export function track(type: TrackType, data: {path?: string; target?: string; ref?: string} = {}) {
  try {
    const body = JSON.stringify({type, ...data});
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', body);
    } else {
      void fetch('/api/track', {method: 'POST', body, keepalive: true});
    }
  } catch { /* ignore */ }
}
