/** City-level location for an IP. Cached in memory; the IP itself is never stored. */
export type Geo = {cc?: string; country?: string; region?: string; city?: string; isp?: string};

const cache = new Map<string, {geo: Geo; at: number}>();
const TTL = 12 * 3600e3;

function isPrivate(ip: string) {
  return !ip || ip === 'unknown' || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i.test(ip);
}

async function getJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {signal: AbortSignal.timeout(2500), headers: {accept: 'application/json'}});
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const s = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : undefined);

export async function lookupGeo(ip: string): Promise<Geo> {
  if (isPrivate(ip)) return {};
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < TTL) return hit.geo;

  let geo: Geo = {};
  const a = await getJson(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code,region,city,connection`);
  if (a && a.success !== false && a.country_code) {
    const conn = (a.connection || {}) as Record<string, unknown>;
    geo = {cc: s(a.country_code)?.toUpperCase(), country: s(a.country), region: s(a.region), city: s(a.city), isp: s(conn.isp) || s(conn.org)};
  } else {
    const b = await getJson(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,isp`);
    if (b && b.status === 'success') geo = {cc: s(b.countryCode)?.toUpperCase(), country: s(b.country), region: s(b.regionName), city: s(b.city), isp: s(b.isp)};
  }
  cache.set(ip, {geo, at: Date.now()});
  if (cache.size > 5000) cache.delete(cache.keys().next().value as string);
  return geo;
}
