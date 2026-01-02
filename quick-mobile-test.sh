#!/bin/bash

echo "📱 Быстрый тест мобильной версии L'Épatage"
echo "=========================================="

# Проверяем серверы
echo "🔍 Проверяем серверы..."

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Фронтенд работает: http://localhost:5173"
else
    echo "❌ Фронтенд не работает"
fi

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Бэкенд работает: http://localhost:3001"
else
    echo "❌ Бэкенд не работает"
fi

echo ""
echo "📋 Что тестировать:"
echo "1. 🏠 Главная страница - http://localhost:5173/"
echo "2. 🛍️ Каталог - http://localhost:5173/catalog"
echo "3. 👗 Страница товара - http://localhost:5173/products/corset-hourglass"
echo "4. 📝 Форма заказа - http://localhost:5173/custom-order"
echo "5. ⚙️ Админ панель - http://localhost:5173/admin"

echo ""
echo "🧪 Как тестировать в браузере:"
echo "1. Откройте любую из ссылок выше"
echo "2. Нажмите F12 (или Cmd+Opt+I на Mac)"
echo "3. Нажмите на иконку мобильного устройства 📱"
echo "4. Выберите iPhone или Samsung Galaxy"
echo "5. Проверьте все функции"

echo ""
echo "🎯 Ключевые функции для проверки:"
echo "• Мобильное меню (гамбургер)"
echo "• Свайп по изображениям на странице товара"
echo "• Адаптивность всех страниц"
echo "• Работа форм на мобильных"

echo ""
echo "🚨 Если что-то не работает:"
echo "• Проверьте консоль браузера (F12 → Console)"
echo "• Убедитесь, что серверы запущены"
echo "• Попробуйте обновить страницу"

echo ""
echo "🎉 Удачного тестирования!"

