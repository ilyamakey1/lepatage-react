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

# Запускаем frontend с доступом из сети
echo "📱 Запуск React сайта..."
npx vite --host --port 5173 &
FRONTEND_PID=$!

# Ждем запуска frontend
sleep 5

# Получаем локальный IP адрес (работает на macOS и Linux)
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
fi

echo ""
echo "✅ Серверы запущены:"
echo "📱 Frontend (локально): http://localhost:5173"
echo "📱 Frontend (из сети):  http://${LOCAL_IP}:5173"
echo "🔧 Backend (локально):  http://localhost:3001"
echo "🔧 Backend (из сети):   http://${LOCAL_IP}:3001"
echo ""
echo "🌐 Открываем браузер..."
open http://localhost:5173

# Ожидание
wait

