#!/bin/bash

# Простой скрипт для быстрого доступа через интернет
# Использует localtunnel (без регистрации)

cd "/Users/ila/Desktop/lepatage основа/lepatage-react"

echo "🚀 Запуск L'Épatage с доступом через интернет..."
echo ""

# Останавливаем старые процессы
pkill -f "vite" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true
pkill -f "lt" 2>/dev/null || true
sleep 2

# Собираем проект
echo "📦 Сборка проекта..."
npm run build

# Запускаем backend
echo "🔧 Запуск API сервера..."
npm run server:prod &
BACKEND_PID=$!

# Ждем запуска backend
sleep 3

# Проверяем backend
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Backend не запустился"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Backend запущен"

# Устанавливаем localtunnel если нужно
if ! command -v lt &> /dev/null; then
    echo "📦 Установка localtunnel..."
    npm install -g localtunnel
fi

echo ""
echo "🌍 Запуск туннеля для доступа через интернет..."
echo "⏳ Генерируется публичный URL..."
echo ""

# Функция очистки
cleanup() {
    echo ""
    echo "🛑 Остановка серверов..."
    kill $BACKEND_PID 2>/dev/null || true
    pkill -f "lt" 2>/dev/null || true
    echo "✅ Остановлено"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Запускаем localtunnel
lt --port 3001 --print-requests



