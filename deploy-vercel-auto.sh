#!/bin/bash

echo "🚀 Автоматический деплой L'Épatage на Vercel..."

# Проверяем, что vercel установлен
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI не найден. Устанавливаем..."
    npm install -g vercel
fi

# Собираем проект
echo "📦 Собираем проект..."
npm run build

# Создаем файл с автоматическими ответами для Vercel
echo "🔧 Настраиваем автоматические ответы..."
cat > .vercelignore << EOF
node_modules
.git
.env.local
*.log
EOF

# Создаем .vercelrc для автоматической конфигурации
cat > .vercelrc << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "server/vercel.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/vercel.ts"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/public/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/index.html"
    }
  ]
}
EOF

echo "🌐 Деплоим на Vercel..."
echo "📝 Используем ваш GitHub аккаунт: ilyas-projects-ea9a5350"

# Деплой с автоматическими ответами
echo "Y" | vercel --prod --yes --confirm

echo "✅ Деплой завершен!"
echo "🌍 Ваш сайт теперь доступен онлайн!"
echo "🔗 Проверьте URL выше для вашего живого сайта"
