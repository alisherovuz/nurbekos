import {recordEvent} from '@/lib/analytics';
import {addMessage, notifyTelegram} from '@/lib/messages';
import {clientIp, rateLimit} from '@/lib/store';

const TOPICS = ['Collaboration', 'Speaking or event', 'Mentoring', 'Investment', 'Just saying hi'];

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60_000)) {
    return Response.json({error: 'Too many messages. Please try again in a few minutes.'}, {status: 429});
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({error: 'Invalid request'}, {status: 400}); }

  // Honeypot field: real people never fill it in.
  if (typeof body.website === 'string' && body.website) return Response.json({ok: true});

  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const name = text(body.name, 80);
  const contact = text(body.contact, 120);
  const message = text(body.message, 4000);
  const topic = TOPICS.includes(text(body.topic, 40)) ? text(body.topic, 40) : 'Just saying hi';

  if (name.length < 2) return Response.json({error: 'Please enter your name.'}, {status: 400});
  if (contact.length < 3) return Response.json({error: 'Please add an email or Telegram username so I can reply.'}, {status: 400});
  if (message.length < 10) return Response.json({error: 'Your message is a little short — tell me a bit more.'}, {status: 400});

  const saved = await addMessage({name, contact, topic, message});
  await Promise.all([notifyTelegram(saved), recordEvent(req, {type: 'contact', path: '/contact', target: topic})]);
  return Response.json({ok: true});
}
