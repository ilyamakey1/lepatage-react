#!/bin/bash

echo "🧪 Тестирование мобильной версии L'Épatage..."

# Проверяем, что сервер запущен
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Сервер не запущен. Запускаем сервер..."
    npm run server &
    sleep 5
fi

# Проверяем, что фронтенд запущен
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Фронтенд не запущен. Запускаем фронтенд..."
    npm run dev &
    sleep 10
fi

echo "✅ Серверы запущены"

# Тестируем основные страницы
echo "📱 Тестируем мобильную версию..."

# Тест главной страницы
echo "1. Тестируем главную страницу..."
curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" http://localhost:5173/ | grep -q "L'ÉPATAGE" && echo "✅ Главная страница загружается" || echo "❌ Проблема с главной страницей"

# Тест каталога
echo "2. Тестируем каталог..."
curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" http://localhost:5173/catalog | grep -q "Каталог" && echo "✅ Каталог загружается" || echo "❌ Проблема с каталогом"

# Тест API
echo "3. Тестируем API..."
curl -s http://localhost:3001/api/products/getAll?limit=5 | grep -q "products" && echo "✅ API работает" || echo "❌ Проблема с API"

# Тест производительности
echo "4. Тестируем производительность..."
start_time=$(date +%s%N)
curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" http://localhost:5173/ > /dev/null
end_time=$(date +%s%N)
load_time=$(( (end_time - start_time) / 1000000 ))
echo "⏱️  Время загрузки: ${load_time}ms"

if [ $load_time -lt 2000 ]; then
    echo "✅ Отличная производительность"
elif [ $load_time -lt 5000 ]; then
    echo "⚠️  Хорошая производительность"
else
    echo "❌ Медленная загрузка"
fi

echo "🎉 Тестирование завершено!"
echo ""
echo "📱 Для полного тестирования мобильной версии:"
echo "1. Откройте http://localhost:5173 в браузере"
echo "2. Включите режим разработчика (F12)"
echo "3. Выберите мобильное устройство (iPhone/Android)"
echo "4. Проверьте все страницы и функции"
echo ""
echo "🔧 Рекомендации для оптимизации:"
echo "- Используйте Lighthouse для аудита производительности"
echo "- Проверьте Core Web Vitals"
echo "- Оптимизируйте изображения"
echo "- Минимизируйте CSS/JS"