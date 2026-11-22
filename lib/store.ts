import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';

/** Persistent folder. Livops mounts /app/data and exposes it as DATA_DIR. */
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');

export function dataPath(...parts: string[]) {
  return path.join(DATA_DIR, ...parts);
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, {recursive: true});
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(dataPath(file), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Atomic write: write to a temp file, then rename over the target. */
export async function writeJson(file: string, value: unknown) {
  const target = dataPath(file);
  await ensureDir(path.dirname(target));
  const tmp = `${target}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, target);
}

export async function appendLine(file: string, value: unknown) {
  const target = dataPath(file);
  await ensureDir(path.dirname(target));
  await fs.appendFile(target, `${JSON.stringify(value)}\n`, 'utf8');
}

export async function readLines<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(dataPath(file), 'utf8');
    const rows: T[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line) as T); } catch { /* skip a broken line */ }
    }
    return rows;
  } catch {
    return [];
  }
}

/** A random secret kept in the data folder, created on first use. */
export async function localSecret(name: string): Promise<string> {
  const file = dataPath(`.${name}`);
  try {
    const existing = (await fs.readFile(file, 'utf8')).trim();
    if (existing) return existing;
  } catch { /* create below */ }
  const value = crypto.randomBytes(32).toString('hex');
  await ensureDir(DATA_DIR);
  await fs.writeFile(file, value, {encoding: 'utf8', mode: 0o600});
  return value;
}

/** Tiny in-memory rate limiter (per process). */
const buckets = new Map<string, {count: number; reset: number}>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, {count: 1, reset: now + windowMs});
    if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
