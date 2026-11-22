import {revalidatePath} from 'next/cache';
import {isAdminRequest, unauthorized} from '@/lib/auth';
import {getContent, resetContent, saveContent} from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  return Response.json({content: await getContent()});
}

export async function PUT(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = (await req.json().catch(() => null)) as {content?: unknown; reset?: boolean} | null;
  if (!body) return Response.json({error: 'Invalid JSON'}, {status: 400});
  const content = body.reset ? await resetContent() : await saveContent(body.content);
  revalidatePath('/', 'layout');
  return Response.json({ok: true, content});
}
