import {ADMIN_COOKIE} from '@/lib/auth';

export async function POST() {
  const res = Response.json({ok: true});
  res.headers.append('set-cookie', `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
  return res;
}
