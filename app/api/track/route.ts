import {recordEvent, type EventType} from '@/lib/analytics';
import {isAdminRequest} from '@/lib/auth';
import {clientIp, rateLimit} from '@/lib/store';

const TYPES: EventType[] = ['view', 'open', 'click', 'game', 'leave'];

export async function POST(req: Request) {
  if (isAdminRequest(req)) return new Response(null, {status: 204}); // don't count the owner
  if (!rateLimit(`track:${clientIp(req)}`, 120, 60_000)) return new Response(null, {status: 429});
  const raw = await req.text();
  if (raw.length > 2000) return new Response(null, {status: 413});
  try {
    const body = JSON.parse(raw) as {type?: string; path?: string; target?: string; ref?: string; s?: string; screen?: string; tz?: string; ms?: number};
    if (!body.type || !TYPES.includes(body.type as EventType)) return new Response(null, {status: 400});
    await recordEvent(req, {type: body.type as EventType, path: body.path, target: body.target, ref: body.ref, s: body.s, screen: body.screen, tz: body.tz, ms: body.ms});
  } catch {
    return new Response(null, {status: 400});
  }
  return new Response(null, {status: 204});
}
