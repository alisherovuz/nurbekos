import crypto from 'crypto';
import {readJson, writeJson} from './store';

export type Message = {
  id: string;
  t: number;
  name: string;
  contact: string;
  topic: string;
  message: string;
  read: boolean;
};

const FILE = 'messages.json';

export async function listMessages() {
  const list = await readJson<Message[]>(FILE, []);
  return list.sort((a, b) => b.t - a.t);
}

export async function addMessage(input: Omit<Message, 'id' | 't' | 'read'>) {
  const list = await readJson<Message[]>(FILE, []);
  const message: Message = {...input, id: crypto.randomUUID(), t: Date.now(), read: false};
  list.push(message);
  await writeJson(FILE, list.slice(-2000));
  return message;
}

export async function updateMessage(id: string, change: Partial<Pick<Message, 'read'>>) {
  const list = await readJson<Message[]>(FILE, []);
  await writeJson(FILE, list.map(m => (m.id === id ? {...m, ...change} : m)));
}

export async function deleteMessage(id: string) {
  const list = await readJson<Message[]>(FILE, []);
  await writeJson(FILE, list.filter(m => m.id !== id));
}

/** Optional: forward new messages to Telegram when the owner sets these two variables. */
export async function notifyTelegram(message: Message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const text = [
    '📬 New message from alisherov.com',
    `From: ${message.name}`,
    `Contact: ${message.contact}`,
    `Topic: ${message.topic}`,
    '',
    message.message,
  ].join('\n');
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({chat_id: chat, text, disable_web_page_preview: true}),
      signal: AbortSignal.timeout(5000),
    });
  } catch { /* the message is already saved; notification is best-effort */ }
}
