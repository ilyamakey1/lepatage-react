#!/bin/bash

echo "🚀 Простой деплой на Vercel..."

# Собираем проект
echo "📦 Собираем проект..."
npm run build

# Деплой на Vercel
echo "🌐 Деплоим на Vercel..."
echo "📝 Введите 'Y' когда спросит о настройке проекта"
echo "📝 Выберите ваш GitHub аккаунт: ilyas-projects-ea9a5350"

vercel --prod

echo "✅ Деплой завершен!"
