// Генерация черновика через API-сервер Hermes Agent (OpenAI-совместимый /v1/chat/completions, stateless).
import type { StoredMessage } from './store.js';

export interface DraftMeta {
  intent?: string;
  needs_human?: boolean;
  summary?: string;
  [key: string]: unknown;
}

export interface GeneratedDraft {
  text: string;
  meta: DraftMeta;
  raw: string;
}

export interface HermesOptions {
  url: string;
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

const CHANNEL_RULES: Record<string, string> = {
  instagram:
    'Канал: Instagram Direct. Пиши коротко и по делу, обращайся на «вы», без markdown (никаких **, #, списков со звёздочками), ' +
    'эмодзи — не больше одного. Текст клиенту — не длиннее 900 символов. Ссылки давай полными (https://lepatage.com/...).',
  telegram:
    'Канал: Telegram. Пиши коротко, на «вы», без markdown. Текст клиенту — не длиннее 900 символов.',
};

export function systemPrompt(channel: string): string {
  return [
    CHANNEL_RULES[channel] ?? CHANNEL_RULES.instagram,
    'Ты пишешь ЧЕРНОВИК ответа: его проверит менеджер L\'EPATAGE перед отправкой.',
    'Перед любым ответом о товарах, цене или наличии вызови инструменты lepatage-stock. Не придумывай цены, сроки и товары.',
    'Стоимость доставки не называй — «стоимость доставки уточнит менеджер».',
    'В конце ответа обязательно добавь блок ```json {"intent": "...", "needs_human": true|false, "summary": "..."} ```.',
  ].join('\n');
}

/** Отделяет хвостовой ```json-блок с метаданными от текста клиенту. Нет блока или он битый → meta {}. */
export function parseDraft(raw: string): { text: string; meta: DraftMeta } {
  const m = raw.match(/```json\s*([\s\S]*?)```\s*$/i);
  if (!m) return { text: cleanup(raw), meta: {} };
  const text = cleanup(raw.slice(0, m.index));
  try {
    const parsed: unknown = JSON.parse(m[1]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { text, meta: parsed as DraftMeta };
  } catch {
    // битый JSON — текст оставляем, мету нет
  }
  return { text, meta: {} };
}

/** Instagram не рендерит markdown — снимаем то, что модель могла вставить по привычке. */
function cleanup(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function generateDraft(
  history: Pick<StoredMessage, 'role' | 'text'>[],
  ctx: { channel: string; userId: string },
  opts: HermesOptions,
): Promise<GeneratedDraft> {
  const doFetch = opts.fetch ?? fetch;
  const res = await doFetch(`${opts.url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
      // Долгая память Hermes — отдельно на каждого клиента, чтобы диалоги не смешивались.
      'X-Hermes-Session-Key': `${ctx.channel === 'instagram' ? 'ig' : ctx.channel}:${ctx.userId}`,
    },
    body: JSON.stringify({
      model: opts.model ?? 'hermes-agent',
      messages: [
        { role: 'system', content: systemPrompt(ctx.channel) },
        ...history.slice(-20).map((m) => ({ role: m.role, content: m.text })),
      ],
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Hermes ${res.status}: ${body.slice(0, 300)}`);
  const content = (JSON.parse(body) as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('Hermes вернул пустой ответ');
  return { ...parseDraft(content), raw: content };
}
