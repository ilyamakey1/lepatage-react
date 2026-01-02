#!/bin/bash
cd "/Users/ila/Desktop/lepatage основа/lepatage-react"
echo "🚀 Запуск светлого React сайта L'ÉPATAGE..."
echo "📍 Папка: $(pwd)"

# Останавливаем старые процессы
pkill -f "vite" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true
sleep 2

# Запускаем backend
echo "🔧 Запуск API сервера..."
npx tsx server/index.ts &
BACKEND_PID=$!

# Ждем запуска backend
sleep 3

# Запускаем frontend
echo "📱 Запуск React сайта..."
npx vite --port 5173 &
FRONTEND_PID=$!

# Ждем запуска frontend
sleep 5

echo ""
echo "✅ Серверы запущены:"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "🌐 Открываем браузер..."
open http://localhost:5173

# Ожидание
wait

