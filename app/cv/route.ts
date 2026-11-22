import {recordEvent} from '@/lib/analytics';
import {isAdminRequest} from '@/lib/auth';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    try { await recordEvent(req, {type: 'cv', path: '/cv', ref: req.headers.get('referer') || undefined}); } catch { /* never block the download */ }
  }
  return Response.redirect(new URL('/cv.pdf', req.url), 307);
}
