import {ADMIN_COOKIE, adminConfigured, checkPassword, createSession} from '@/lib/auth';
import {clientIp, rateLimit} from '@/lib/store';

export async function POST(req: Request) {
  if (!adminConfigured()) return Response.json({error: 'Admin is not set up yet. Add an ADMIN_PASSWORD variable in Livops (8+ characters).'}, {status: 503});
  if (!rateLimit(`login:${clientIp(req)}`, 6, 15 * 60_000)) return Response.json({error: 'Too many attempts. Wait 15 minutes and try again.'}, {status: 429});
  let password = '';
  try { password = String(((await req.json()) as {password?: unknown}).password || ''); } catch { /* empty */ }
  if (!checkPassword(password)) return Response.json({error: 'Wrong password.'}, {status: 401});
  const session = createSession();
  const res = Response.json({ok: true});
  res.headers.append('set-cookie', `${ADMIN_COOKIE}=${encodeURIComponent(session.token)}; Path=/; Max-Age=${session.maxAge}; HttpOnly; Secure; SameSite=Strict`);
  return res;
}
