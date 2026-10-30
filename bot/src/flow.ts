// Оркестратор: входящее сообщение → черновик → одобрение владельцем в Telegram → отправка клиенту.
// Все внешние зависимости внедряются, чтобы flow можно было тестировать на фейках.
import type { GeneratedDraft } from './hermes.js';
import type { IgEvent } from './instagram.js';
import type { Draft, DraftStatus, StoredMessage, Store } from './store.js';

export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface DraftView {
  draftId: number;
  channel: string;
  userId: string;
  username?: string;
  clientText: string;
  draftText: string;
  meta: Record<string, unknown>;
  status: DraftStatus;
  sentText?: string;
  error?: string;
  note?: string;
  warning?: string;
}

export interface Notifier {
  /** Публикует черновик с кнопками; возвращает ссылку на сообщение(я) для последующего редактирования. */
  postDraft(view: DraftView): Promise<string>;
  updateDraft(ref: string, view: DraftView): Promise<void>;
  /** Простое уведомление владельцу (обычный текст). */
  notify(text: string): Promise<void>;
}

export interface FlowDeps {
  store: Store;
  generate(history: Pick<StoredMessage, 'role' | 'text'>[], ctx: { channel: string; userId: string }): Promise<Pick<GeneratedDraft, 'text' | 'meta'>>;
  send(recipientId: string, text: string): Promise<Array<{ messageId: string; text: string }>>;
  getUsername(userId: string): Promise<string | undefined>;
  notifier: Notifier;
  now?: () => number;
  log?: (...args: unknown[]) => void;
}

export type ApproveResult = { ok: true } | { ok: false; reason: string };

/** Последовательная очередь задач по ключу: сообщения одного клиента обрабатываются строго по порядку. */
class KeyedQueue {
  private tails = new Map<string, Promise<unknown>>();

  run<T>(key: string, task: () => Promise<T>): Promise<T> {
    const prev = this.tails.get(key) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(task);
    this.tails.set(key, next);
    const cleanup = () => {
      if (this.tails.get(key) === next) this.tails.delete(key);
    };
    next.then(cleanup, cleanup);
    return next;
  }

  async idle(): Promise<void> {
    while (this.tails.size) await Promise.allSettled([...this.tails.values()]);
  }
}

const attachmentNote = (ev: IgEvent) =>
  ev.attachments.length ? `[вложение: ${ev.attachments.map((a) => a.type).join(', ')}]` : '';

export function createFlow(deps: FlowDeps) {
  const { store, notifier } = deps;
  const now = deps.now ?? Date.now;
  const log = deps.log ?? ((...a: unknown[]) => console.error('[flow]', ...a));
  const channel = 'instagram';
  // inbox: генерация черновиков; out: отправка и echo — echo нашей же отправки должен прийти после записи её mid.
  const inbox = new KeyedQueue();
  const out = new KeyedQueue();

  async function view(draft: Draft, extra: Partial<DraftView> = {}): Promise<DraftView> {
    const userMsg = draft.userMessageId ? await store.getMessage(draft.userMessageId) : undefined;
    return {
      draftId: draft.id,
      channel: draft.channel,
      userId: draft.userId,
      username: await deps.getUsername(draft.userId),
      clientText: userMsg?.text ?? '',
      draftText: draft.text,
      meta: draft.meta,
      status: draft.status,
      sentText: draft.sentText ?? undefined,
      error: draft.error ?? undefined,
      ...extra,
    };
  }

  async function refresh(draftId: number, extra: Partial<DraftView> = {}): Promise<void> {
    const d = await store.getDraft(draftId);
    if (!d?.tgMessageId) return;
    try {
      await notifier.updateDraft(d.tgMessageId, await view(d, extra));
    } catch (e) {
      log('не удалось обновить черновик в Telegram', draftId, e);
    }
  }

  async function supersede(userId: string, note: string): Promise<void> {
    for (const d of await store.supersedePending(channel, userId)) await refresh(d.id, { note });
  }

  async function onIncoming(ev: IgEvent): Promise<void> {
    const userId = ev.senderId;
    const text = [ev.text?.trim() ?? '', attachmentNote(ev)].filter(Boolean).join('\n');
    const msg = await store.insertMessage({ channel, userId, role: 'user', text, externalId: ev.mid, createdAt: ev.timestamp });
    if (!msg.inserted) return; // ретрай вебхука Meta с тем же mid

    if (!ev.text?.trim()) {
      const who = (await deps.getUsername(userId)) ?? userId;
      await notifier.notify(`📎 Instagram · @${who} прислал(а) ${attachmentNote(ev) || 'сообщение без текста'}. Черновик не создан — ответьте в приложении Instagram.`);
      return;
    }

    await supersede(userId, 'пришло новое сообщение клиента');

    let gen: Pick<GeneratedDraft, 'text' | 'meta'>;
    try {
      gen = await deps.generate(await store.getHistory(channel, userId, 20), { channel, userId });
    } catch (e) {
      const who = (await deps.getUsername(userId)) ?? userId;
      await notifier.notify(`⚠️ Не удалось подготовить черновик для @${who}: ${(e as Error).message}\nСообщение клиента: ${text}`);
      return;
    }
    if (!gen.text.trim()) {
      await notifier.notify(`⚠️ Модель вернула пустой черновик. Сообщение клиента: ${text}`);
      return;
    }

    const draftId = await store.createDraft({ channel, userId, userMessageId: msg.id, text: gen.text, meta: gen.meta });
    const draft = (await store.getDraft(draftId))!;
    const ref = await notifier.postDraft(await view(draft));
    await store.setDraftTgMessage(draftId, ref);
  }

  async function onEcho(ev: IgEvent): Promise<void> {
    if (await store.hasExternalId(ev.mid)) return; // echo нашей же отправки
    // Иначе владелец ответил сам из приложения Instagram.
    const userId = ev.recipientId;
    const text = ev.text?.trim() || attachmentNote(ev) || '[сообщение]';
    const msg = await store.insertMessage({ channel, userId, role: 'assistant', text, externalId: ev.mid, createdAt: ev.timestamp });
    if (msg.inserted) await supersede(userId, 'отвечено вручную в приложении');
  }

  function handleInstagramEvent(ev: IgEvent): Promise<void> {
    return ev.isEcho ? out.run(ev.recipientId, () => onEcho(ev)) : inbox.run(ev.senderId, () => onIncoming(ev));
  }

  async function approve(draftId: number, editedText?: string): Promise<ApproveResult> {
    const draft = await store.getDraft(draftId);
    if (!draft) return { ok: false, reason: 'not_found' };
    if (!(await store.claimDraft(draftId))) return { ok: false, reason: draft.status };

    const text = editedText?.trim() || draft.text;
    const last = await store.lastUserMessageAt(draft.channel, draft.userId);
    const warning =
      last !== null && now() - last > MESSAGING_WINDOW_MS
        ? 'с последнего сообщения клиента прошло больше 24 ч — Meta может не принять ответ'
        : undefined;
    await refresh(draftId, { warning, note: 'отправляется…' });

    return out.run(draft.userId, async (): Promise<ApproveResult> => {
      try {
        const sent = await deps.send(draft.userId, text);
        await recordSent(draft, sent);
        await store.markSent(draftId, text);
        await refresh(draftId, { warning, note: editedText ? 'отправлен исправленный текст' : undefined });
        return { ok: true };
      } catch (e) {
        await recordSent(draft, (e as { sent?: Array<{ messageId: string; text: string }> }).sent ?? []);
        const error = (e as Error).message;
        await store.markFailed(draftId, error);
        await refresh(draftId, { warning });
        return { ok: false, reason: error };
      }
    });
  }

  async function recordSent(draft: Draft, sent: Array<{ messageId: string; text: string }>): Promise<void> {
    for (const s of sent) {
      await store.insertMessage({ channel: draft.channel, userId: draft.userId, role: 'assistant', text: s.text, externalId: s.messageId });
    }
  }

  async function reject(draftId: number): Promise<ApproveResult> {
    const draft = await store.getDraft(draftId);
    if (!draft) return { ok: false, reason: 'not_found' };
    if (!(await store.rejectDraft(draftId))) return { ok: false, reason: draft.status };
    await refresh(draftId);
    return { ok: true };
  }

  const editKey = (chatId: string | number) => `edit:${chatId}`;

  /** «Изменить»: следующий текст владельца из этого чата уйдёт клиенту вместо черновика. */
  async function startEdit(chatId: string | number, draftId: number): Promise<ApproveResult> {
    const draft = await store.getDraft(draftId);
    if (!draft) return { ok: false, reason: 'not_found' };
    if (draft.status !== 'pending') return { ok: false, reason: draft.status };
    await store.setState(editKey(chatId), String(draftId));
    return { ok: true };
  }

  async function pendingEdit(chatId: string | number): Promise<number | null> {
    const v = await store.getState(editKey(chatId));
    return v === null ? null : Number(v);
  }

  async function cancelEdit(chatId: string | number): Promise<boolean> {
    const had = (await pendingEdit(chatId)) !== null;
    await store.deleteState(editKey(chatId));
    return had;
  }

  async function submitEdit(chatId: string | number, text: string): Promise<ApproveResult> {
    const draftId = await pendingEdit(chatId);
    if (draftId === null) return { ok: false, reason: 'no_edit' };
    await store.deleteState(editKey(chatId));
    return approve(draftId, text);
  }

  return {
    handleInstagramEvent,
    approve,
    reject,
    startEdit,
    pendingEdit,
    cancelEdit,
    submitEdit,
    idle: async () => {
      await inbox.idle();
      await out.idle();
    },
  };
}

export type Flow = ReturnType<typeof createFlow>;
