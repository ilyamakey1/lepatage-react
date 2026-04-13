# Деплой L’Épatage на Fly.io

Один процесс Express отдаёт и собранный фронт (`dist`), и API (`/api`). База — SQLite на **томе** Fly, чтобы данные переживали деплои.

## 1. Подготовка

1. Установите [flyctl](https://fly.io/docs/hands-on/install-flyctl/).
2. В `fly.toml` замените `app = "lepatage-replace-me"` на имя приложения (`fly apps create` или при первом `fly launch`).

## 2. Том для базы (один раз)

```bash
fly volumes create lepatage_data --region ams --size 3
```

Регион должен совпадать с `primary_region` в `fly.toml`.

## 3. Секреты (обязательно в production)

```bash
fly secrets set JWT_SECRET="$(openssl rand -base64 48)"
fly secrets set CORS_ORIGINS="https://YOUR-APP.fly.dev"
```

После подключения своего домена добавьте его в `CORS_ORIGINS` через запятую:

```bash
fly secrets set CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

Без `JWT_SECRET` вход и проверка токенов не будут безопасны. Без корректного `CORS_ORIGINS` сервер не стартует в `NODE_ENV=production` (см. `server/index.ts`).

## 4. Деплой

```bash
fly deploy
```

## 5. Первый администратор

Создайте пользователя через регистрацию на сайте, затем в SQLite выставьте `is_admin = 1` для этого пользователя (через `fly ssh console` и `sqlite3 /data/lepatage.db`), либо добавьте отдельный скрипт/seed только для первого деплоя.

## 6. Бэкапы SQLite

Рекомендуемый минимум:

1. **Периодический дамп** (cron на машине или [Fly Machines scheduled](https://fly.io/docs/machines/guides-examples/schedule-tasks/)):
   ```bash
   fly ssh console -C "sqlite3 /data/lepatage.db '.backup /tmp/backup.db'" 
   ```
   Затем скачать файл или выгрузить в объектное хранилище.

2. **Снимки тома** — уточняйте актуальные опции в документации Fly для вашего региона/плана.

3. Перед крупными изменениями схемы — вручную копировать `/data/lepatage.db`.

## 7. Turso (опционально)

Если перейдёте на удалённый libSQL (Turso), задайте `DATABASE_URL` и `DATABASE_AUTH_TOKEN` через `fly secrets` и уберьте том SQLite, когда приложение будет стабильно работать с удалённой БД.

## 8. Локальная проверка Docker

```bash
docker build -t lepatage .
docker run --rm -p 3001:3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=dev-secret \
  -e CORS_ORIGINS=http://localhost:3001 \
  lepatage
```

Для полного цикла с томом проще тестировать через `fly deploy`.
