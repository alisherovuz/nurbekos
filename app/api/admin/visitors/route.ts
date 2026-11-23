import {getVisitor, getVisitors} from '@/lib/analytics';
import {isAdminRequest, unauthorized} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30));
  const id = url.searchParams.get('id');
  if (id) {
    const data = await getVisitor(id, 90);
    return data ? Response.json(data) : Response.json({error: 'Not found'}, {status: 404});
  }
  return Response.json(await getVisitors(days));
}
