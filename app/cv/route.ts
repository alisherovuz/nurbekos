import {recordEvent} from '@/lib/analytics';
import {isAdminRequest} from '@/lib/auth';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    try { await recordEvent(req, {type: 'cv', path: '/cv', ref: req.headers.get('referer') || undefined}); } catch { /* never block the download */ }
  }
  // Relative redirect: behind the Livops proxy, req.url carries the internal host, not alisherov.com.
  return new Response(null, {status: 307, headers: {location: '/cv.pdf', 'cache-control': 'no-store'}});
}
