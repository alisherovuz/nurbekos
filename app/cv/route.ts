import {recordEvent} from '@/lib/analytics';
import {isAdminRequest} from '@/lib/auth';
import {clientIp, rateLimit} from '@/lib/store';

export async function GET(req: Request) {
  // Browsers and PDF viewers often request the file 2-3 times for one download: count it once per 30s.
  const key = `cv:${clientIp(req)}:${req.headers.get('user-agent') || ''}`;
  if (!isAdminRequest(req) && rateLimit(key, 1, 30_000)) {
    try { await recordEvent(req, {type: 'cv', path: '/cv', ref: req.headers.get('referer') || undefined}); } catch { /* never block the download */ }
  }
  // Relative redirect: behind the Livops proxy, req.url carries the internal host, not alisherov.com.
  return new Response(null, {status: 307, headers: {location: '/cv.pdf', 'cache-control': 'no-store'}});
}
