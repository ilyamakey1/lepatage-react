#!/bin/bash

# Скрипт для запуска серверов разработки
echo "🚀 Запуск серверов разработки L'epatage..."

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Убиваем существующие процессы на портах 3001 и 5173
echo "🔄 Остановка существующих процессов..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Ждем немного
sleep 2

# Запускаем backend сервер в фоне
echo "🔧 Запуск backend сервера (порт 3001)..."
npm run server &
BACKEND_PID=$!

# Ждем запуска backend
sleep 3

# Проверяем, что backend запустился
if ! lsof -i :3001 > /dev/null 2>&1; then
    echo "❌ Ошибка: Backend сервер не запустился"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Backend сервер запущен на http://localhost:3001"

# Запускаем frontend сервер в фоне (без --host, чтобы избежать ошибки uv_interface_addresses)
echo "🎨 Запуск frontend сервера (порт 5173)..."
npm run dev &
FRONTEND_PID=$!

# Ждем запуска frontend
sleep 3

# Проверяем, что frontend запустился
if ! lsof -i :5173 > /dev/null 2>&1; then
    echo "❌ Ошибка: Frontend сервер не запустился"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Получаем локальный IP адрес (работает на macOS и Linux)
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
fi

echo "✅ Frontend сервер запущен на http://localhost:5173"
echo ""
echo "🎉 Все серверы запущены успешно!"
echo "📱 Откройте браузер и перейдите по адресу:"
echo "   Локально:     http://localhost:5173"
echo "   Из сети:      http://${LOCAL_IP}:5173"
echo ""
echo "📊 Статус серверов:"
echo "   Backend API:  http://localhost:3001/api"
echo "   Backend API (сеть): http://${LOCAL_IP}:3001/api"
echo "   Frontend:     http://localhost:5173"
echo "   Frontend (сеть): http://${LOCAL_IP}:5173"
echo "   Health check: http://localhost:3001/health"
echo ""
echo "🛑 Для остановки серверов нажмите Ctrl+C"

# Функция для корректного завершения
cleanup() {
    echo ""
    echo "🛑 Остановка серверов..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    echo "✅ Серверы остановлены"
    exit 0
}

# Перехватываем сигналы для корректного завершения
trap cleanup SIGINT SIGTERM

# Ждем завершения
wait

