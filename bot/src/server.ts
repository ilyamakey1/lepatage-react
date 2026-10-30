// HTTP-сервис бота: вебхуки Instagram и служебного Telegram-бота. Слушает только 127.0.0.1 — наружу через nginx.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import express from 'express';
import { loadConfig } from './config.js';
import { createFlow } from './flow.js';
import { generateDraft } from './hermes.js';
import { createInstagram, parseWebhook, verifySignature } from './instagram.js';
import { BOT_DIR } from './paths.js';
import { openBotDb, Store } from './store.js';
import { createTelegram, createTelegramHandler, type TgUpdate } from './telegram.js';

const log = (...a: unknown[]) => console.error(new Date().toISOString(), ...a);

const envFile = join(BOT_DIR, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const cfg = loadConfig();

const store = new Store(await openBotDb(cfg.BOT_DB_URL));
await store.init();

const ig = createInstagram({ accessToken: cfg.IG_ACCESS_TOKEN, version: cfg.IG_GRAPH_VERSION });
const tg = createTelegram({ token: cfg.TG_BOT_TOKEN, adminChatIds: cfg.TG_ADMIN_CHAT_IDS, log });
const flow = createFlow({
  store,
  generate: (history, ctx) =>
    generateDraft(history, ctx, { url: cfg.HERMES_API_URL, apiKey: cfg.HERMES_API_KEY, model: cfg.HERMES_MODEL }),
  send: ig.sendMessage,
  getUsername: ig.getUsername,
  notifier: tg.notifier,
  log,
});
const handleTgUpdate = createTelegramHandler(flow, tg, cfg.TG_ADMIN_CHAT_IDS, log);

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

const app = express();
app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.json({ ok: true, tgMode: cfg.TG_MODE });
});

// Подтверждение подписки вебхука в кабинете Meta.
app.get('/webhooks/instagram', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && typeof token === 'string' && safeEqual(token, cfg.IG_VERIFY_TOKEN)) {
    res.type('text/plain').send(String(challenge ?? ''));
  } else {
    res.sendStatus(403);
  }
});

// Подпись считается по сырому телу, поэтому express.raw, а не express.json.
app.post('/webhooks/instagram', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!verifySignature(raw, req.get('x-hub-signature-256'), cfg.IG_APP_SECRET)) {
    res.sendStatus(401);
    return;
  }
  res.sendStatus(200); // Meta ждёт быстрый ответ; обработка — асинхронно.
  let body: unknown;
  try {
    body = JSON.parse(raw.toString('utf8'));
  } catch {
    return log('instagram: тело не JSON');
  }
  for (const ev of parseWebhook(body)) {
    flow.handleInstagramEvent(ev).catch((e) => log('instagram: ошибка обработки', ev.mid, e));
  }
});

app.post('/webhooks/telegram-admin', express.json({ limit: '1mb' }), (req, res) => {
  const secret = req.get('x-telegram-bot-api-secret-token') ?? '';
  if (cfg.TG_MODE !== 'webhook' || !cfg.TG_WEBHOOK_SECRET || !safeEqual(secret, cfg.TG_WEBHOOK_SECRET)) {
    res.sendStatus(401);
    return;
  }
  res.sendStatus(200);
  handleTgUpdate(req.body as TgUpdate).catch((e) => log('telegram: ошибка обработки', e));
});

app.listen(cfg.BOT_PORT, '127.0.0.1', () => log(`lepatage-bot слушает 127.0.0.1:${cfg.BOT_PORT}, Telegram: ${cfg.TG_MODE}`));

if (cfg.TG_MODE === 'polling') {
  void tg.startPolling(handleTgUpdate);
} else if (cfg.TG_WEBHOOK_URL && cfg.TG_WEBHOOK_SECRET) {
  tg.setWebhook(cfg.TG_WEBHOOK_URL, cfg.TG_WEBHOOK_SECRET)
    .then(() => log('telegram: webhook установлен', cfg.TG_WEBHOOK_URL))
    .catch((e) => log('telegram: setWebhook', e.message));
}
