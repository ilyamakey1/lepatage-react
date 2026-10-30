# lepatage-bot

Черновики ответов клиентам L'EPATAGE в Instagram Direct. Сообщение клиента → Hermes Agent (с MCP-инструментами
каталога `lepatage-stock`) → черновик владельцу в служебный Telegram-бот → клиенту уходит только после ✅.

- `src/catalog.ts` — поиск, наличие и расчёт цены по базе сайта (только чтение).
- `src/mcp-server.ts` — stdio MCP `lepatage-stock`: `list_catalog`, `search_products`, `check_availability`, `quote`.
- `src/server.ts` — вебхуки Instagram и Telegram на `127.0.0.1:3003`; состояние — в отдельной базе `.data/bot.db`.
- `hermes/` — персона `SOUL.md` и фрагменты конфига Hermes.

Отдельный сервис: свой `package.json`, npm-команды запускать только из `bot/`.

## Локально

```bash
cd bot
npm install
cp .env.example .env   # заполнить; TG_MODE=polling — без публичного URL
npm test               # node:test
npm run typecheck
npm start
```

Проверить MCP без Hermes: `npx tsx scripts/mcp-smoke.ts` (поиск «vivienne» и расчёт 2× «Пояс "Элеганс"» по реальной базе).
Instagram-вебхук локально не придёт — нужен публичный HTTPS (сервер или туннель).

## Сервер

1. Hermes Agent — отдельным непривилегированным пользователем (не root, не пользователь сайта):
   `sudo adduser --disabled-password hermes`, установить Hermes по инструкции Nous Research под ним, `hermes setup` (модель/ключ провайдера).
   Дать пользователю `hermes` чтение `/var/www/lepatage/bot` и `/var/www/lepatage/database/lepatage.db` (база в режиме `delete`, записи не нужно).
2. В `~hermes/.hermes/.env` — из `hermes/env.example`; в `~hermes/.hermes/config.yaml` — слить `hermes/config.example.yaml`
   (имена `disabled_toolsets` сверить через `hermes tools`); `hermes/SOUL.md` → `~hermes/.hermes/SOUL.md`. Запустить API-сервер Hermes (слушает `127.0.0.1:8642`).
3. `cd /var/www/lepatage/bot && npm ci && cp .env.example .env` → заполнить, `HERMES_API_KEY` = `API_SERVER_KEY`.
4. `pm2 start ecosystem.config.cjs && pm2 save`. Проверка: `curl 127.0.0.1:3003/health`.
5. nginx — добавить в server-блок lepatage.com (не применено, сделать вручную):

   ```nginx
   location /webhooks/ {
       proxy_pass http://127.0.0.1:3003;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   }
   ```

## Meta (Instagram)

1. developers.facebook.com → создать приложение → продукт **Instagram** → **API setup with Instagram login**.
2. Разрешения `instagram_business_basic`, `instagram_business_manage_messages`; подключить Business-аккаунт L'EPATAGE,
   сгенерировать токен → `IG_ACCESS_TOKEN`. App Secret → `IG_APP_SECRET`.
3. Webhooks: Callback URL `https://lepatage.com/webhooks/instagram`, Verify token = `IG_VERIFY_TOKEN`, подписаться на поле `messages`.
4. В Development mode сообщения приходят только от аккаунтов с ролью в приложении (тестировщики). Для настоящих клиентов
   нужен App Review на `instagram_business_manage_messages` и переключение в Live.
5. Ответить можно в течение 24 ч после последнего сообщения клиента — бот предупредит, если окно истекло.

## Telegram

Создать бота у @BotFather → `TG_BOT_TOKEN`. Узнать свой chat_id (например, через @userinfobot) → `TG_ADMIN_CHAT_IDS`.
Сообщения из других чатов игнорируются и пишутся в лог pm2. Под черновиком: ✅ отправить, ✏️ изменить (следующее сообщение
уйдёт клиенту вместо черновика, `/cancel` — отмена), 🚫 пропустить. Если ответить клиенту прямо из приложения Instagram,
черновик пометится «отвечено вручную».
