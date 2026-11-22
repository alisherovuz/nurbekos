import crypto from 'crypto';
import {cookies} from 'next/headers';

export const ADMIN_COOKIE = 'nos_admin';
const SESSION_DAYS = 7;

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8);
}

/** Signing key changes when the password changes, which signs everyone out. */
function key() {
  return crypto.createHash('sha256').update(`nurbekos-admin:${process.env.ADMIN_PASSWORD || ''}`).digest();
}

function sign(payload: string) {
  return crypto.createHmac('sha256', key()).update(payload).digest('base64url');
}

export function createSession() {
  const expires = Date.now() + SESSION_DAYS * 864e5;
  const payload = `${expires}.${crypto.randomBytes(8).toString('hex')}`;
  return {token: `${payload}.${sign(payload)}`, maxAge: SESSION_DAYS * 86400};
}

export function verifyToken(token: string | undefined) {
  if (!token || !adminConfigured()) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
  return Number(parts[0]) > Date.now();
}

export function checkPassword(input: string) {
  if (!adminConfigured()) return false;
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD || '').digest();
  return crypto.timingSafeEqual(a, b);
}

export async function isAdmin() {
  const jar = await cookies();
  return verifyToken(jar.get(ADMIN_COOKIE)?.value);
}

/** For route handlers: reads the cookie straight from the request. */
export function isAdminRequest(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith(`${ADMIN_COOKIE}=`));
  return verifyToken(match ? decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1)) : undefined);
}

export function unauthorized() {
  return Response.json({error: 'Not signed in'}, {status: 401});
}
