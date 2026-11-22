import {isAdminRequest, unauthorized} from '@/lib/auth';
import {deleteMessage, listMessages, updateMessage} from '@/lib/messages';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  return Response.json({messages: await listMessages()});
}

export async function PATCH(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as {id?: string; read?: boolean};
  if (!body.id) return Response.json({error: 'Missing id'}, {status: 400});
  await updateMessage(body.id, {read: Boolean(body.read)});
  return Response.json({ok: true});
}

export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({error: 'Missing id'}, {status: 400});
  await deleteMessage(id);
  return Response.json({ok: true});
}
