import {getStats} from '@/lib/analytics';
import {isAdminRequest, unauthorized} from '@/lib/auth';
import {listMessages} from '@/lib/messages';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  const url = new URL(req.url);
  const days = Math.min(90, Math.max(7, Number(url.searchParams.get('days')) || 30));
  const [stats, messages] = await Promise.all([getStats(days), listMessages()]);
  return Response.json({...stats, unread: messages.filter(m => !m.read).length});
}
