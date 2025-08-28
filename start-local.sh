#!/bin/bash

echo "🚀 Запуск L'Épatage локально..."

# Проверяем, что все зависимости установлены
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости..."
    npm install
fi

# Проверяем базу данных
if [ ! -f "database/lepatage.db" ]; then
    echo "🗄️ Создаем базу данных..."
    npm run db:migrate
    npm run db:seed
fi

# Останавливаем предыдущие процессы
echo "🛑 Останавливаем предыдущие процессы..."
pkill -f "npm run" 2>/dev/null || true

# Запускаем полный сайт
echo "🌟 Запускаем сайт с полным функционалом..."
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo "🗄️ API: http://localhost:3001/api"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

npm run dev:full
