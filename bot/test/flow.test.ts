import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { createFlow, MESSAGING_WINDOW_MS, type DraftView, type Flow } from '../src/flow.ts';
import { MetaApiError, type IgEvent } from '../src/instagram.ts';
import { Store } from '../src/store.ts';
import { createTelegramHandler, renderDraft } from '../src/telegram.ts';

const CUSTOMER = 'cust-1';
const BIZ = 'biz';

function incoming(mid: string, text?: string, extra: Partial<IgEvent> = {}): IgEvent {
  return { senderId: CUSTOMER, recipientId: BIZ, mid, text, isEcho: false, timestamp: clock.t, attachments: [], ...extra };
}
function echo(mid: string, text: string): IgEvent {
  return { senderId: BIZ, recipientId: CUSTOMER, mid, text, isEcho: true, timestamp: clock.t, attachments: [] };
}

const clock = { t: 1_700_000_000_000 };
let store: Store;
let flow: Flow;
let generated: Array<{ history: string[] }>;
let sends: Array<{ to: string; text: string }>;
let sendImpl: (to: string, text: string) => Promise<Array<{ messageId: string; text: string }>>;
let posts: DraftView[];
let updates: Array<{ ref: string; view: DraftView }>;
let notes: string[];

beforeEach(async () => {
  clock.t = 1_700_000_000_000;
  store = new Store(createClient({ url: ':memory:' }), () => clock.t);
  await store.init();
  generated = [];
  sends = [];
  posts = [];
  updates = [];
  notes = [];
  let outN = 0;
  sendImpl = async (_to, text) => [{ messageId: `out-${++outN}`, text }];
  flow = createFlow({
    store,
    now: () => clock.t,
    log: () => {},
    generate: async (history) => {
      generated.push({ history: history.map((m) => `${m.role}:${m.text}`) });
      return { text: `Черновик ${generated.length}`, meta: { intent: 'price', needs_human: false } };
    },
    send: async (to, text) => {
      sends.push({ to, text });
      return sendImpl(to, text);
    },
    getUsername: async () => 'client_ig',
    notifier: {
      postDraft: async (view) => {
        posts.push(view);
        return `ref-${view.draftId}`;
      },
      updateDraft: async (ref, view) => {
        updates.push({ ref, view });
      },
      notify: async (text) => {
        notes.push(text);
      },
    },
  });
});

async function receive(ev: IgEvent) {
  await flow.handleInstagramEvent(ev);
  await flow.idle();
}

describe('flow', () => {
  it('входящее → черновик в Telegram; ретрай того же mid не создаёт второй', async () => {
    await receive(incoming('m1', 'Сколько стоит пояс?'));
    await receive(incoming('m1', 'Сколько стоит пояс?'));
    assert.equal(generated.length, 1);
    assert.equal(posts.length, 1);
    assert.equal(posts[0].clientText, 'Сколько стоит пояс?');
    assert.equal(posts[0].username, 'client_ig');
    assert.equal((await store.getDraft(posts[0].draftId))?.tgMessageId, `ref-${posts[0].draftId}`);
  });

  it('сообщения одного клиента обрабатываются по порядку, история уходит в генерацию', async () => {
    await Promise.all([flow.handleInstagramEvent(incoming('m1', 'Первое')), flow.handleInstagramEvent(incoming('m2', 'Второе'))]);
    await flow.idle();
    assert.deepEqual(generated.map((g) => g.history), [['user:Первое'], ['user:Первое', 'user:Второе']]);
  });

  it('двойное ✅ отправляет один раз', async () => {
    await receive(incoming('m1', 'Цена?'));
    const id = posts[0].draftId;
    const [a, b] = await Promise.all([flow.approve(id), flow.approve(id)]);
    assert.equal(sends.length, 1);
    assert.deepEqual([a.ok, b.ok].sort(), [false, true]);
    assert.deepEqual(await flow.approve(id), { ok: false, reason: 'sent' });
    const d = await store.getDraft(id);
    assert.equal(d?.status, 'sent');
    assert.equal(d?.sentText, 'Черновик 1');
    const history = await store.getHistory('instagram', CUSTOMER);
    assert.deepEqual(history.map((m) => [m.role, m.externalId]), [['user', 'm1'], ['assistant', 'out-1']]);
    assert.equal(updates.at(-1)?.view.status, 'sent');
  });

  it('новое сообщение суперсидит старый черновик', async () => {
    await receive(incoming('m1', 'Есть корсет KATE?'));
    const first = posts[0].draftId;
    await receive(incoming('m2', 'А размер S?'));
    assert.equal((await store.getDraft(first))?.status, 'superseded');
    assert.ok(updates.some((u) => u.ref === `ref-${first}` && u.view.status === 'superseded'));
    assert.equal((await store.getDraft(posts[1].draftId))?.status, 'pending');
    assert.deepEqual(await flow.approve(first), { ok: false, reason: 'superseded' });
    assert.equal(sends.length, 0);
  });

  it('echo нашей отправки игнорируется; ручной ответ из приложения суперсидит черновик', async () => {
    await receive(incoming('m1', 'Привет'));
    await flow.approve(posts[0].draftId);
    await receive(echo('out-1', 'Черновик 1'));
    assert.equal((await store.getHistory('instagram', CUSTOMER)).length, 2);

    await receive(incoming('m2', 'А доставка?'));
    const pending = posts[1].draftId;
    await receive(echo('manual-1', 'Доставка — 500 ₽'));
    assert.equal((await store.getDraft(pending))?.status, 'superseded');
    const u = updates.find((x) => x.ref === `ref-${pending}` && x.view.status === 'superseded');
    assert.match(u?.view.note ?? '', /отвечено вручную/);
    const last = (await store.getHistory('instagram', CUSTOMER)).at(-1);
    assert.deepEqual([last?.role, last?.text, last?.externalId], ['assistant', 'Доставка — 500 ₽', 'manual-1']);
    await receive(echo('manual-1', 'Доставка — 500 ₽')); // ретрай echo
    assert.equal((await store.getHistory('instagram', CUSTOMER)).length, 4); // m1, out-1, m2, manual-1
  });

  it('ошибка Send API → failed, ошибка видна в Telegram', async () => {
    sendImpl = async () => {
      throw new MetaApiError('Meta Send API: Outside of allowed window (code 10)');
    };
    await receive(incoming('m1', 'Цена?'));
    const id = posts[0].draftId;
    const r = await flow.approve(id);
    assert.equal(r.ok, false);
    const d = await store.getDraft(id);
    assert.equal(d?.status, 'failed');
    assert.match(d?.error ?? '', /allowed window/);
    const last = updates.at(-1)!.view;
    assert.equal(last.status, 'failed');
    assert.match(renderDraft(last), /allowed window/);
  });

  it('«Изменить»: следующий текст владельца уходит вместо черновика', async () => {
    await receive(incoming('m1', 'Цена?'));
    const id = posts[0].draftId;
    assert.deepEqual(await flow.startEdit(42, id), { ok: true });
    assert.equal(await flow.pendingEdit(42), id);
    assert.deepEqual(await flow.submitEdit(42, 'Мой текст'), { ok: true });
    assert.deepEqual(sends, [{ to: CUSTOMER, text: 'Мой текст' }]);
    assert.equal((await store.getDraft(id))?.sentText, 'Мой текст');
    assert.equal(await flow.pendingEdit(42), null);
  });

  it('вложение без текста → только уведомление, без черновика', async () => {
    await receive(incoming('m1', undefined, { attachments: [{ type: 'image', url: 'https://cdn/x.jpg' }] }));
    assert.equal(generated.length, 0);
    assert.equal(posts.length, 0);
    assert.match(notes[0], /вложение: image/);
  });

  it('больше 24 ч с последнего сообщения клиента — предупреждение', async () => {
    await receive(incoming('m1', 'Цена?'));
    clock.t += MESSAGING_WINDOW_MS + 1;
    await flow.approve(posts[0].draftId);
    assert.match(updates.at(-1)?.view.warning ?? '', /24 ч/);
  });

  it('ошибка генерации → уведомление владельцу, без черновика', async () => {
    flow = createFlow({
      store,
      log: () => {},
      generate: async () => {
        throw new Error('timeout');
      },
      send: async () => [],
      getUsername: async () => undefined,
      notifier: { postDraft: async () => 'x', updateDraft: async () => {}, notify: async (t) => void notes.push(t) },
    });
    await receive(incoming('m1', 'Цена?'));
    assert.match(notes[0], /timeout/);
  });
});

describe('telegram handler', () => {
  it('принимает только админ-чаты; ✅ вызывает отправку', async () => {
    await receive(incoming('m1', 'Цена?'));
    const id = posts[0].draftId;
    const replies: string[] = [];
    const answers: string[] = [];
    const handle = createTelegramHandler(
      flow,
      { reply: async (_c, t) => void replies.push(t) as never, answerCallback: async (_id, t) => void answers.push(t) },
      ['100'],
      () => {},
    );
    const cb = (chat: number, data: string) => ({ update_id: 1, callback_query: { id: 'q', data, message: { message_id: 1, chat: { id: chat } } } });

    await handle(cb(999, `d:send:${id}`));
    assert.equal(sends.length, 0, 'чужой чат игнорируется');

    await handle(cb(100, `d:send:${id}`));
    await handle(cb(100, `d:send:${id}`));
    assert.equal(sends.length, 1);
    assert.deepEqual(answers, ['Отправлено ✅', 'Уже отправлено']);

    await handle({ update_id: 2, message: { message_id: 2, chat: { id: 100 }, text: 'просто текст' } });
    assert.match(replies.at(-1)!, /нет черновика в режиме правки/);
  });

  it('HTML в черновике экранируется', () => {
    const html = renderDraft({
      draftId: 1,
      channel: 'instagram',
      userId: '1',
      username: 'a<b>',
      clientText: '<script>&',
      draftText: 'Цена <b>1</b>',
      meta: {},
      status: 'pending',
    });
    assert.ok(html.includes('@a&lt;b&gt;'));
    assert.ok(html.includes('&lt;script&gt;&amp;'));
    assert.ok(html.includes('Цена &lt;b&gt;1&lt;/b&gt;'));
  });
});
