// Instagram API with Instagram Login: подпись вебхука, разбор событий, Send API.
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface IgAttachment {
  type: string;
  url?: string;
}

export interface IgEvent {
  senderId: string;
  recipientId: string;
  mid: string;
  text?: string;
  isEcho: boolean;
  timestamp: number;
  attachments: IgAttachment[];
}

/** Проверка X-Hub-Signature-256 ("sha256=<hex>") по сырому телу запроса. */
export function verifySignature(rawBody: Buffer | string, header: string | undefined, appSecret: string): boolean {
  if (!header?.startsWith('sha256=') || !appSecret) return false;
  const expected = Buffer.from(createHmac('sha256', appSecret).update(rawBody).digest('hex'), 'utf8');
  const given = Buffer.from(header.slice('sha256='.length).toLowerCase(), 'utf8');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** События сообщений из вебхука `object: 'instagram'`. Прочтения, реакции, удалённые сообщения пропускаются. */
export function parseWebhook(body: unknown): IgEvent[] {
  const b = body as { object?: string; entry?: Array<{ messaging?: unknown[] }> };
  if (b?.object !== 'instagram' || !Array.isArray(b.entry)) return [];
  const events: IgEvent[] = [];
  for (const entry of b.entry) {
    for (const raw of entry.messaging ?? []) {
      const e = raw as {
        sender?: { id?: string };
        recipient?: { id?: string };
        timestamp?: number;
        message?: {
          mid?: string;
          text?: string;
          is_echo?: boolean;
          is_deleted?: boolean;
          is_unsupported?: boolean;
          attachments?: Array<{ type?: string; payload?: { url?: string } }>;
        };
      };
      const m = e.message;
      if (!m?.mid || m.is_deleted || !e.sender?.id || !e.recipient?.id) continue;
      events.push({
        senderId: String(e.sender.id),
        recipientId: String(e.recipient.id),
        mid: m.mid,
        text: m.text,
        isEcho: m.is_echo === true,
        timestamp: Number(e.timestamp ?? Date.now()),
        attachments: (m.attachments ?? []).map((a) => ({ type: a.type ?? 'unknown', url: a.payload?.url })),
      });
    }
  }
  return events;
}

/**
 * Режет текст на части ≤ maxBytes байт UTF-8 (по абзацам, потом по строкам/предложениям, в крайнем случае по символам).
 * Лимит Send API — 1000 байт; кириллица занимает 2 байта, поэтому считаем байты, а не символы.
 */
export function splitMessage(text: string, maxBytes = 1000): string[] {
  const bytes = (s: string) => Buffer.byteLength(s, 'utf8');
  const pieces = (s: string, seps: RegExp[]): string[] => {
    if (bytes(s) <= maxBytes) return [s];
    const [sep, ...rest] = seps;
    if (!sep) {
      const out: string[] = [];
      let cur = '';
      for (const ch of s) {
        if (bytes(cur + ch) > maxBytes) {
          out.push(cur);
          cur = '';
        }
        cur += ch;
      }
      return cur ? [...out, cur] : out;
    }
    return s.split(sep).flatMap((p) => pieces(p, rest));
  };
  const parts = pieces(text.trim(), [/\n{2,}/, /\n/, /(?<=[.!?…])\s+/, / /]).map((p) => p.trim()).filter(Boolean);
  // Склеиваем мелкие части обратно, пока влезает.
  const out: string[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last !== undefined && bytes(`${last}\n\n${p}`) <= maxBytes) out[out.length - 1] = `${last}\n\n${p}`;
    else out.push(p);
  }
  return out;
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public sent: Array<{ messageId: string; text: string }> = [],
  ) {
    super(message);
  }
}

export interface InstagramOptions {
  accessToken: string;
  version?: string;
  fetch?: typeof fetch;
}

export function createInstagram(opts: InstagramOptions) {
  const doFetch = opts.fetch ?? fetch;
  const base = `https://graph.instagram.com/${opts.version || 'v23.0'}`;
  const headers = { Authorization: `Bearer ${opts.accessToken}`, 'Content-Type': 'application/json' };
  const usernames = new Map<string, string>();

  /** Отправляет текст (частями при необходимости). Возвращает mid каждой части. */
  async function sendMessage(recipientId: string, text: string): Promise<Array<{ messageId: string; text: string }>> {
    const sent: Array<{ messageId: string; text: string }> = [];
    for (const chunk of splitMessage(text)) {
      const res = await doFetch(`${base}/me/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ recipient: { id: recipientId }, message: { text: chunk } }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message_id?: string;
        error?: { message?: string; code?: number; error_subcode?: number };
      };
      if (!res.ok || !body.message_id) {
        const e = body.error;
        const detail = e ? `${e.message ?? 'ошибка'} (code ${e.code ?? '?'}${e.error_subcode ? `/${e.error_subcode}` : ''})` : `HTTP ${res.status}`;
        throw new MetaApiError(`Meta Send API: ${detail}`, sent);
      }
      sent.push({ messageId: body.message_id, text: chunk });
    }
    return sent;
  }

  /** @username клиента — best-effort, кэш в памяти. */
  async function getUsername(igsid: string): Promise<string | undefined> {
    if (usernames.has(igsid)) return usernames.get(igsid);
    try {
      const res = await doFetch(`${base}/${encodeURIComponent(igsid)}?fields=username,name`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return undefined;
      const { username } = (await res.json()) as { username?: string };
      if (username) usernames.set(igsid, username);
      return username;
    } catch {
      return undefined;
    }
  }

  return { sendMessage, getUsername };
}

export type Instagram = ReturnType<typeof createInstagram>;
