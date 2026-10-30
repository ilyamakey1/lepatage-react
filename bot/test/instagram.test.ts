import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createInstagram, MetaApiError, parseWebhook, splitMessage, verifySignature } from '../src/instagram.ts';

const SECRET = 'app-secret';
const sign = (body: string, secret = SECRET) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

describe('verifySignature', () => {
  const body = JSON.stringify({ object: 'instagram', entry: [] });

  it('валидная подпись', () => {
    assert.equal(verifySignature(Buffer.from(body), sign(body), SECRET), true);
  });

  it('битая подпись, чужой секрет, изменённое тело', () => {
    const bad = sign(body).replace(/.$/, (c) => (c === '0' ? '1' : '0'));
    assert.equal(verifySignature(body, bad, SECRET), false);
    assert.equal(verifySignature(body, sign(body, 'other'), SECRET), false);
    assert.equal(verifySignature(body + ' ', sign(body), SECRET), false);
  });

  it('подпись другой длины и без префикса — false, без исключения', () => {
    assert.equal(verifySignature(body, 'sha256=abc', SECRET), false);
    assert.equal(verifySignature(body, sign(body) + '00', SECRET), false);
    assert.equal(verifySignature(body, sign(body).slice(7), SECRET), false);
    assert.equal(verifySignature(body, undefined, SECRET), false);
  });
});

describe('parseWebhook', () => {
  const hook = {
    object: 'instagram',
    entry: [
      {
        id: 'biz',
        time: 1,
        messaging: [
          { sender: { id: 'cust' }, recipient: { id: 'biz' }, timestamp: 1000, message: { mid: 'm1', text: 'Привет' } },
          { sender: { id: 'biz' }, recipient: { id: 'cust' }, timestamp: 2000, message: { mid: 'm2', text: 'Ответ', is_echo: true } },
          {
            sender: { id: 'cust' },
            recipient: { id: 'biz' },
            timestamp: 3000,
            message: { mid: 'm3', attachments: [{ type: 'image', payload: { url: 'https://cdn/x.jpg' } }] },
          },
          { sender: { id: 'cust' }, recipient: { id: 'biz' }, timestamp: 4000, read: { mid: 'm1' } },
          { sender: { id: 'cust' }, recipient: { id: 'biz' }, timestamp: 5000, message: { mid: 'm4', is_deleted: true } },
        ],
      },
    ],
  };

  it('разбирает текст, echo и вложения; пропускает прочтения и удаления', () => {
    const ev = parseWebhook(hook);
    assert.equal(ev.length, 3);
    assert.deepEqual(ev[0], {
      senderId: 'cust',
      recipientId: 'biz',
      mid: 'm1',
      text: 'Привет',
      isEcho: false,
      timestamp: 1000,
      attachments: [],
    });
    assert.equal(ev[1].isEcho, true);
    assert.equal(ev[1].recipientId, 'cust');
    assert.deepEqual(ev[2].attachments, [{ type: 'image', url: 'https://cdn/x.jpg' }]);
    assert.equal(ev[2].text, undefined);
  });

  it('другой object — пусто', () => {
    assert.deepEqual(parseWebhook({ object: 'page', entry: hook.entry }), []);
    assert.deepEqual(parseWebhook(null), []);
  });
});

describe('splitMessage', () => {
  it('короткий текст — одним куском', () => {
    assert.deepEqual(splitMessage('Добрый день!'), ['Добрый день!']);
  });

  it('длинный — по абзацам, каждый кусок ≤ 1000 байт', () => {
    const para = 'Корсет шьётся по вашим меркам. '.repeat(12).trim();
    const parts = splitMessage([para, para, para].join('\n\n'));
    assert.ok(parts.length >= 2);
    for (const p of parts) assert.ok(Buffer.byteLength(p) <= 1000, `${Buffer.byteLength(p)} байт`);
    assert.equal(parts.join(' ').replace(/\s+/g, ' '), [para, para, para].join(' '));
  });

  it('сплошной текст без пробелов режется по символам', () => {
    const parts = splitMessage('я'.repeat(1200));
    assert.deepEqual(parts.map((p) => p.length), [500, 500, 200]);
  });
});

describe('sendMessage', () => {
  it('шлёт на /me/messages с Bearer и возвращает mid', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const ig = createInstagram({
      accessToken: 'TOKEN',
      fetch: (async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(JSON.stringify({ recipient_id: 'cust', message_id: `mid-${calls.length}` }));
      }) as typeof fetch,
    });
    const sent = await ig.sendMessage('cust', 'Здравствуйте!');
    assert.deepEqual(sent, [{ messageId: 'mid-1', text: 'Здравствуйте!' }]);
    assert.equal(calls[0].url, 'https://graph.instagram.com/v23.0/me/messages');
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer TOKEN');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), { recipient: { id: 'cust' }, message: { text: 'Здравствуйте!' } });
  });

  it('ошибка Meta → MetaApiError с текстом ошибки', async () => {
    const ig = createInstagram({
      accessToken: 'T',
      fetch: (async () =>
        new Response(JSON.stringify({ error: { message: 'Outside of allowed window', code: 10, error_subcode: 2534022 } }), {
          status: 400,
        })) as typeof fetch,
    });
    await assert.rejects(ig.sendMessage('cust', 'x'), (e: unknown) => {
      assert.ok(e instanceof MetaApiError);
      assert.match(e.message, /Outside of allowed window \(code 10\/2534022\)/);
      return true;
    });
  });
});
