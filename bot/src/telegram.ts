// Служебный Telegram-бот владельца (Bot API через fetch): черновики с кнопками ✅ / ✏️ / 🚫.
import type { ApproveResult, DraftView, Flow, Notifier } from './flow.js';

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max)}… (обрезано в превью)` : s);

const STATUS_LINE: Record<DraftView['status'], string> = {
  pending: '',
  sending: '⏳ Отправляется…',
  sent: '✅ Отправлено клиенту',
  rejected: '🚫 Пропущено',
  superseded: '⏭ Черновик неактуален',
  failed: '❌ Не отправлено',
};

export function renderDraft(v: DraftView): string {
  const who = v.username ? `@${escapeHtml(v.username)}` : `id ${escapeHtml(v.userId)}`;
  const channel = v.channel === 'instagram' ? 'Instagram' : escapeHtml(v.channel);
  const intent = typeof v.meta.intent === 'string' ? v.meta.intent : '—';
  const human = v.meta.needs_human === true ? '🙋 нужен менеджер' : v.meta.needs_human === false ? '🤖 можно отправить' : '❔ не указано';
  const lines = [
    `📩 <b>${channel}</b> · ${who} · черновик #${v.draftId}`,
    '',
    '<b>Клиент:</b>',
    `<blockquote>${escapeHtml(clip(v.clientText || '—', 1000))}</blockquote>`,
    '<b>Черновик:</b>',
    escapeHtml(clip(v.draftText, 2400)),
    '',
    `<i>intent: ${escapeHtml(intent)} · ${human}</i>`,
  ];
  if (typeof v.meta.summary === 'string' && v.meta.summary) lines.push(`<i>${escapeHtml(clip(v.meta.summary, 300))}</i>`);
  if (v.warning) lines.push(`⚠️ ${escapeHtml(v.warning)}`);
  const status = STATUS_LINE[v.status];
  if (status) lines.push('', `<b>${status}</b>${v.note ? ` — ${escapeHtml(v.note)}` : ''}`);
  else if (v.note) lines.push('', escapeHtml(v.note));
  if (v.status === 'sent' && v.sentText && v.sentText !== v.draftText) {
    lines.push('<b>Отправленный текст:</b>', escapeHtml(clip(v.sentText, 600)));
  }
  if (v.error) lines.push(`<code>${escapeHtml(clip(v.error, 400))}</code>`);
  return lines.join('\n');
}

export function draftKeyboard(draftId: number) {
  return {
    inline_keyboard: [
      [{ text: '✅ Отправить', callback_data: `d:send:${draftId}` }],
      [
        { text: '✏️ Изменить', callback_data: `d:edit:${draftId}` },
        { text: '🚫 Пропустить', callback_data: `d:skip:${draftId}` },
      ],
    ],
  };
}

export interface TelegramOptions {
  token: string;
  adminChatIds: string[];
  fetch?: typeof fetch;
  log?: (...args: unknown[]) => void;
}

// Минимальные типы апдейтов Bot API, которые мы используем.
export interface TgUpdate {
  update_id: number;
  message?: { message_id: number; chat: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; message?: { message_id: number; chat: { id: number } } };
}

export function createTelegram(opts: TelegramOptions) {
  const doFetch = opts.fetch ?? fetch;
  const log = opts.log ?? ((...a: unknown[]) => console.error('[telegram]', ...a));

  async function api<T = unknown>(method: string, params: Record<string, unknown> = {}, timeoutMs = 30_000): Promise<T> {
    const res = await doFetch(`https://api.telegram.org/bot${opts.token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!body.ok) throw new Error(`Telegram ${method}: ${body.description ?? res.status}`);
    return body.result as T;
  }

  const send = (chatId: string | number, html: string, extra: Record<string, unknown> = {}) =>
    api<{ message_id: number }>('sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...extra,
    });

  const notifier: Notifier = {
    async postDraft(view) {
      const refs: Array<{ chat: string; msg: number }> = [];
      for (const chat of opts.adminChatIds) {
        const m = await send(chat, renderDraft(view), { reply_markup: draftKeyboard(view.draftId) });
        refs.push({ chat, msg: m.message_id });
      }
      return JSON.stringify(refs);
    },
    async updateDraft(ref, view) {
      const refs = JSON.parse(ref) as Array<{ chat: string; msg: number }>;
      for (const r of refs) {
        try {
          await api('editMessageText', {
            chat_id: r.chat,
            message_id: r.msg,
            text: renderDraft(view),
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: view.status === 'pending' ? draftKeyboard(view.draftId) : { inline_keyboard: [] },
          });
        } catch (e) {
          if (!String((e as Error).message).includes('message is not modified')) throw e;
        }
      }
    },
    async notify(text) {
      for (const chat of opts.adminChatIds) await send(chat, escapeHtml(text));
    },
  };

  /** Long polling для локальной разработки. Снимает webhook, иначе getUpdates не работает. */
  async function startPolling(onUpdate: (u: TgUpdate) => Promise<void>, signal?: AbortSignal): Promise<void> {
    await api('deleteWebhook');
    let offset = 0;
    while (!signal?.aborted) {
      try {
        const updates = await api<TgUpdate[]>(
          'getUpdates',
          { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] },
          35_000,
        );
        for (const u of updates) {
          offset = u.update_id + 1;
          await onUpdate(u).catch((e) => log('ошибка обработки апдейта', e));
        }
      } catch (e) {
        log('getUpdates', (e as Error).message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  return {
    api,
    notifier,
    reply: (chatId: string | number, text: string) => send(chatId, escapeHtml(text)),
    answerCallback: (id: string, text: string) =>
      api('answerCallbackQuery', { callback_query_id: id, text }).catch((e) => log('answerCallbackQuery', e.message)),
    setWebhook: (url: string, secret: string) =>
      api('setWebhook', { url, secret_token: secret, allowed_updates: ['message', 'callback_query'] }),
    startPolling,
  };
}

export type Telegram = ReturnType<typeof createTelegram>;

const REASONS: Record<string, string> = {
  not_found: 'Черновик не найден',
  sending: 'Уже отправляется',
  sent: 'Уже отправлено',
  rejected: 'Черновик пропущен',
  superseded: 'Черновик неактуален: клиент написал ещё или вы ответили вручную',
  failed: 'Отправка уже завершилась ошибкой — ответьте клиенту в приложении',
  no_edit: 'Нет черновика в режиме правки',
};
const reasonText = (r: ApproveResult) => (r.ok ? 'Готово' : REASONS[r.reason] ?? r.reason);

const HELP =
  'Я присылаю черновики ответов клиентам. Кнопки: ✅ отправить как есть, ✏️ изменить (следующее ваше сообщение уйдёт клиенту), 🚫 пропустить.\n/cancel — отменить правку.';

/** Обработка апдейтов: принимаются ТОЛЬКО чаты из TG_ADMIN_CHAT_IDS, остальное игнорируется. */
export function createTelegramHandler(
  flow: Flow,
  tg: Pick<Telegram, 'reply' | 'answerCallback'>,
  adminChatIds: string[],
  log: (...args: unknown[]) => void = (...a) => console.error('[telegram]', ...a),
) {
  const admins = new Set(adminChatIds.map(String));

  return async function handleUpdate(u: TgUpdate): Promise<void> {
    const cq = u.callback_query;
    if (cq) {
      const chatId = cq.message?.chat.id;
      if (chatId === undefined || !admins.has(String(chatId))) return log('игнор callback из чата', chatId);
      const m = /^d:(send|edit|skip):(\d+)$/.exec(cq.data ?? '');
      if (!m) return void (await tg.answerCallback(cq.id, 'Неизвестная команда'));
      const id = Number(m[2]);
      if (m[1] === 'send') {
        const r = await flow.approve(id);
        await tg.answerCallback(cq.id, r.ok ? 'Отправлено ✅' : reasonText(r));
      } else if (m[1] === 'skip') {
        const r = await flow.reject(id);
        await tg.answerCallback(cq.id, r.ok ? 'Пропущено' : reasonText(r));
      } else {
        const r = await flow.startEdit(chatId, id);
        await tg.answerCallback(cq.id, r.ok ? 'Жду текст' : reasonText(r));
        if (r.ok) await tg.reply(chatId, `✏️ Пришлите текст ответа для черновика #${id} одним сообщением — он уйдёт клиенту вместо черновика.\n/cancel — отмена.`);
      }
      return;
    }

    const msg = u.message;
    if (!msg?.text) return;
    const chatId = msg.chat.id;
    if (!admins.has(String(chatId))) return log('игнор сообщения из чата', chatId);
    const text = msg.text.trim();
    if (/^\/cancel\b/.test(text)) {
      await tg.reply(chatId, (await flow.cancelEdit(chatId)) ? 'Правка отменена, черновик ждёт решения.' : 'Нечего отменять.');
      return;
    }
    if (/^\/(start|help)\b/.test(text)) return void (await tg.reply(chatId, HELP));
    if ((await flow.pendingEdit(chatId)) === null) {
      await tg.reply(chatId, 'Сейчас нет черновика в режиме правки. Нажмите ✏️ под нужным черновиком.');
      return;
    }
    const r = await flow.submitEdit(chatId, text);
    await tg.reply(chatId, r.ok ? '✅ Ваш текст отправлен клиенту.' : `Не отправлено: ${reasonText(r)}`);
  };
}
