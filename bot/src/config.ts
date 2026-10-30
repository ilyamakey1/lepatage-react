// Переменные окружения. Без обязательных секретов сервис не стартует.
import { z } from 'zod';
import { DEFAULT_BOT_DB_URL, DEFAULT_CATALOG_DB_URL } from './paths.js';

const required = z.string().trim().min(1, 'обязательна');

const schema = z
  .object({
    BOT_PORT: z.coerce.number().int().default(3003),
    BOT_DB_URL: z.string().default(DEFAULT_BOT_DB_URL),
    CATALOG_DB_URL: z.string().default(DEFAULT_CATALOG_DB_URL),

    IG_APP_SECRET: required,
    IG_VERIFY_TOKEN: required,
    IG_ACCESS_TOKEN: required,
    IG_GRAPH_VERSION: z.string().default('v23.0'),

    TG_BOT_TOKEN: required,
    TG_ADMIN_CHAT_IDS: required.transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
    TG_MODE: z.enum(['webhook', 'polling']).default('webhook'),
    TG_WEBHOOK_SECRET: z.string().optional(),
    TG_WEBHOOK_URL: z.string().url().optional(),

    HERMES_API_URL: z.string().url().default('http://127.0.0.1:8642/v1'),
    HERMES_API_KEY: required,
    HERMES_MODEL: z.string().default('hermes-agent'),
  })
  .superRefine((c, ctx) => {
    if (c.TG_MODE === 'webhook' && !c.TG_WEBHOOK_SECRET?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['TG_WEBHOOK_SECRET'], message: 'обязательна при TG_MODE=webhook' });
    }
    if (c.TG_WEBHOOK_SECRET && !/^[A-Za-z0-9_-]{1,256}$/.test(c.TG_WEBHOOK_SECRET)) {
      ctx.addIssue({ code: 'custom', path: ['TG_WEBHOOK_SECRET'], message: 'только A-Z, a-z, 0-9, _ и - (требование Telegram)' });
    }
  });

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Пустые строки из .env считаем незаданными, чтобы срабатывали значения по умолчанию.
  const clean = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v !== ''));
  const r = schema.safeParse(clean);
  if (!r.success) {
    const problems = r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Неверная конфигурация бота (см. bot/.env.example):\n${problems}`);
  }
  return r.data;
}
