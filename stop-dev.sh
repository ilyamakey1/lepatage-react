#!/bin/bash

# Скрипт для остановки серверов разработки
echo "🛑 Остановка серверов разработки L'epatage..."

# Останавливаем процессы на портах 3001 и 5173
echo "🔄 Остановка backend сервера (порт 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Backend сервер уже остановлен"

echo "🔄 Остановка frontend сервера (порт 5173)..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "Frontend сервер уже остановлен"

# Дополнительно убиваем все процессы tsx и node связанные с проектом
echo "🔄 Очистка процессов..."
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "vite.*lepatage" 2>/dev/null || true

echo "✅ Все серверы остановлены"

