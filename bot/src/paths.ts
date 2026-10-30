// Пути по умолчанию считаются от папки bot/, а не от cwd — так одинаково работают pm2, Hermes и локальный запуск.
import { fileURLToPath } from 'node:url';

const botDirUrl = new URL('../', import.meta.url);
export const BOT_DIR = fileURLToPath(botDirUrl);

/** file:-URL для libsql: обычный путь, без %-кодирования (в пути к проекту есть кириллица и пробел). */
const fileUrl = (rel: string) => `file:${fileURLToPath(new URL(rel, botDirUrl))}`;

export const DEFAULT_CATALOG_DB_URL = fileUrl('../database/lepatage.db');
export const DEFAULT_BOT_DB_URL = fileUrl('.data/bot.db');
