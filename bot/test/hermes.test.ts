import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDraft, parseDraft } from '../src/hermes.ts';

describe('parseDraft', () => {
  it('отделяет хвостовой ```json блок', () => {
    const r = parseDraft(
      'Здравствуйте! Пояс «Элеганс» стоит 8 900 ₽.\n\n```json\n{"intent":"price","needs_human":false,"summary":"цена пояса"}\n```\n',
    );
    assert.equal(r.text, 'Здравствуйте! Пояс «Элеганс» стоит 8 900 ₽.');
    assert.deepEqual(r.meta, { intent: 'price', needs_human: false, summary: 'цена пояса' });
  });

  it('нет JSON → meta {}', () => {
    assert.deepEqual(parseDraft('Просто текст'), { text: 'Просто текст', meta: {} });
  });

  it('битый JSON → текст без блока, meta {}', () => {
    assert.deepEqual(parseDraft('Текст\n```json\n{oops}\n```'), { text: 'Текст', meta: {} });
  });

  it('json-блок не в конце не трогаем; markdown снимаем', () => {
    const r = parseDraft('**Важно**: ```json {"a":1}``` и дальше текст');
    assert.equal(r.text, 'Важно: ```json {"a":1}``` и дальше текст');
    assert.deepEqual(r.meta, {});
  });
});

describe('generateDraft', () => {
  it('шлёт историю с системным сообщением канала, Bearer и X-Hermes-Session-Key', async () => {
    let req: { url: string; init: RequestInit } | undefined;
    const fakeFetch = (async (url: string, init: RequestInit) => {
      req = { url, init };
      return new Response(
        JSON.stringify({ choices: [{ message: { content: 'Добрый день!\n```json\n{"intent":"greeting","needs_human":false}\n```' } }] }),
      );
    }) as typeof fetch;

    const history = Array.from({ length: 25 }, (_, i) => ({ role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant', text: `m${i}` }));
    const r = await generateDraft(history, { channel: 'instagram', userId: '123' }, { url: 'http://127.0.0.1:8642/v1/', apiKey: 'KEY', fetch: fakeFetch });

    assert.equal(r.text, 'Добрый день!');
    assert.equal(r.meta.intent, 'greeting');
    assert.equal(req!.url, 'http://127.0.0.1:8642/v1/chat/completions');
    const headers = req!.init.headers as Record<string, string>;
    assert.equal(headers.Authorization, 'Bearer KEY');
    assert.equal(headers['X-Hermes-Session-Key'], 'ig:123');
    const body = JSON.parse(String(req!.init.body));
    assert.equal(body.messages[0].role, 'system');
    assert.match(body.messages[0].content, /Instagram/);
    assert.equal(body.messages.length, 21);
    assert.equal(body.messages[1].content, 'm5');
    assert.equal(body.messages[20].content, 'm24');
  });

  it('HTTP-ошибка Hermes → исключение', async () => {
    const fakeFetch = (async () => new Response('nope', { status: 401 })) as unknown as typeof fetch;
    await assert.rejects(
      generateDraft([{ role: 'user', text: 'x' }], { channel: 'instagram', userId: '1' }, { url: 'http://h/v1', apiKey: 'k', fetch: fakeFetch }),
      /Hermes 401/,
    );
  });
});
