// Состояние бота в ОТДЕЛЬНОЙ базе (BOT_DB_URL): переписка, черновики, служебные флаги.
// База сайта сюда не пишет и отсюда не меняется.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createClient, type Client } from '@libsql/client';

export type Role = 'user' | 'assistant';
export type DraftStatus = 'pending' | 'sending' | 'sent' | 'rejected' | 'superseded' | 'failed';

export interface StoredMessage {
  id: number;
  channel: string;
  userId: string;
  role: Role;
  text: string;
  externalId: string | null;
  createdAt: number;
}

export interface Draft {
  id: number;
  channel: string;
  userId: string;
  userMessageId: number | null;
  text: string;
  meta: Record<string, unknown>;
  status: DraftStatus;
  tgMessageId: string | null;
  sentText: string | null;
  error: string | null;
  decidedAt: number | null;
  createdAt: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bot_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  external_id TEXT UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bot_messages_user ON bot_messages (channel, user_id, created_at);
CREATE TABLE IF NOT EXISTS bot_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_message_id INTEGER REFERENCES bot_messages(id),
  text TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'rejected', 'superseded', 'failed')),
  tg_message_id TEXT,
  sent_text TEXT,
  error TEXT,
  decided_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bot_drafts_user ON bot_drafts (channel, user_id, status);
CREATE TABLE IF NOT EXISTS bot_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

function toDraft(r: Record<string, unknown>): Draft {
  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(String(r.meta ?? '{}'));
  } catch {
    // битый JSON — пустая мета
  }
  return {
    id: Number(r.id),
    channel: String(r.channel),
    userId: String(r.user_id),
    userMessageId: r.user_message_id === null ? null : Number(r.user_message_id),
    text: String(r.text),
    meta,
    status: String(r.status) as DraftStatus,
    tgMessageId: str(r.tg_message_id),
    sentText: str(r.sent_text),
    error: str(r.error),
    decidedAt: r.decided_at === null ? null : Number(r.decided_at),
    createdAt: Number(r.created_at),
  };
}

export async function openBotDb(url: string): Promise<Client> {
  if (url.startsWith('file:') && !url.includes(':memory:')) mkdirSync(dirname(url.slice('file:'.length)), { recursive: true });
  return createClient({ url });
}

export class Store {
  constructor(
    private db: Client,
    private now: () => number = Date.now,
  ) {}

  async init(): Promise<void> {
    await this.db.executeMultiple(SCHEMA);
  }

  /** INSERT OR IGNORE по external_id: повтор вебхука Meta с тем же mid ничего не создаёт. */
  async insertMessage(m: {
    channel: string;
    userId: string;
    role: Role;
    text: string;
    externalId?: string | null;
    createdAt?: number;
  }): Promise<{ inserted: boolean; id: number | null }> {
    const rs = await this.db.execute({
      sql: `INSERT OR IGNORE INTO bot_messages (channel, user_id, role, text, external_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [m.channel, m.userId, m.role, m.text, m.externalId ?? null, m.createdAt ?? this.now()],
    });
    return rs.rowsAffected === 1 ? { inserted: true, id: Number(rs.lastInsertRowid) } : { inserted: false, id: null };
  }

  async hasExternalId(externalId: string): Promise<boolean> {
    const rs = await this.db.execute({ sql: 'SELECT 1 FROM bot_messages WHERE external_id = ?', args: [externalId] });
    return rs.rows.length > 0;
  }

  async getMessage(id: number): Promise<StoredMessage | undefined> {
    const rs = await this.db.execute({ sql: 'SELECT * FROM bot_messages WHERE id = ?', args: [id] });
    const r = rs.rows[0];
    return r && this.toMessage(r);
  }

  /** Последние `limit` сообщений диалога в хронологическом порядке. */
  async getHistory(channel: string, userId: string, limit = 20): Promise<StoredMessage[]> {
    const rs = await this.db.execute({
      sql: `SELECT * FROM (SELECT * FROM bot_messages WHERE channel = ? AND user_id = ?
            ORDER BY created_at DESC, id DESC LIMIT ?) ORDER BY created_at, id`,
      args: [channel, userId, limit],
    });
    return rs.rows.map((r) => this.toMessage(r));
  }

  async lastUserMessageAt(channel: string, userId: string): Promise<number | null> {
    const rs = await this.db.execute({
      sql: `SELECT MAX(created_at) AS t FROM bot_messages WHERE channel = ? AND user_id = ? AND role = 'user'`,
      args: [channel, userId],
    });
    const t = rs.rows[0]?.t;
    return t === null || t === undefined ? null : Number(t);
  }

  async createDraft(d: {
    channel: string;
    userId: string;
    userMessageId: number | null;
    text: string;
    meta: Record<string, unknown>;
  }): Promise<number> {
    const rs = await this.db.execute({
      sql: `INSERT INTO bot_drafts (channel, user_id, user_message_id, text, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [d.channel, d.userId, d.userMessageId, d.text, JSON.stringify(d.meta), this.now()],
    });
    return Number(rs.lastInsertRowid);
  }

  async getDraft(id: number): Promise<Draft | undefined> {
    const rs = await this.db.execute({ sql: 'SELECT * FROM bot_drafts WHERE id = ?', args: [id] });
    const r = rs.rows[0];
    return r && toDraft(r);
  }

  async setDraftTgMessage(id: number, tgMessageId: string): Promise<void> {
    await this.db.execute({ sql: 'UPDATE bot_drafts SET tg_message_id = ? WHERE id = ?', args: [tgMessageId, id] });
  }

  /** Все pending-черновики клиента → superseded. Возвращает их (чтобы обновить сообщения в Telegram). */
  async supersedePending(channel: string, userId: string): Promise<Draft[]> {
    const rs = await this.db.execute({
      sql: `UPDATE bot_drafts SET status = 'superseded', decided_at = ?
            WHERE channel = ? AND user_id = ? AND status = 'pending' RETURNING *`,
      args: [this.now(), channel, userId],
    });
    return rs.rows.map(toDraft);
  }

  /** Атомарно забрать черновик на отправку: true только у одного из конкурирующих нажатий ✅. */
  async claimDraft(id: number): Promise<boolean> {
    const rs = await this.db.execute({
      sql: `UPDATE bot_drafts SET status = 'sending', decided_at = ? WHERE id = ? AND status = 'pending'`,
      args: [this.now(), id],
    });
    return rs.rowsAffected === 1;
  }

  async rejectDraft(id: number): Promise<boolean> {
    const rs = await this.db.execute({
      sql: `UPDATE bot_drafts SET status = 'rejected', decided_at = ? WHERE id = ? AND status = 'pending'`,
      args: [this.now(), id],
    });
    return rs.rowsAffected === 1;
  }

  async markSent(id: number, sentText: string): Promise<void> {
    await this.db.execute({
      sql: `UPDATE bot_drafts SET status = 'sent', sent_text = ?, error = NULL WHERE id = ?`,
      args: [sentText, id],
    });
  }

  async markFailed(id: number, error: string): Promise<void> {
    await this.db.execute({ sql: `UPDATE bot_drafts SET status = 'failed', error = ? WHERE id = ?`, args: [error, id] });
  }

  async getState(key: string): Promise<string | null> {
    const rs = await this.db.execute({ sql: 'SELECT value FROM bot_state WHERE key = ?', args: [key] });
    return str(rs.rows[0]?.value);
  }

  async setState(key: string, value: string): Promise<void> {
    await this.db.execute({
      sql: 'INSERT INTO bot_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: [key, value],
    });
  }

  async deleteState(key: string): Promise<void> {
    await this.db.execute({ sql: 'DELETE FROM bot_state WHERE key = ?', args: [key] });
  }

  private toMessage(r: Record<string, unknown>): StoredMessage {
    return {
      id: Number(r.id),
      channel: String(r.channel),
      userId: String(r.user_id),
      role: String(r.role) as Role,
      text: String(r.text),
      externalId: str(r.external_id),
      createdAt: Number(r.created_at),
    };
  }
}
