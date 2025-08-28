#!/bin/bash

echo "🔗 Подключение к GitHub репозиторию..."

# Проверяем, что git инициализирован
if [ ! -d ".git" ]; then
    echo "❌ Git не инициализирован. Инициализируем..."
    git init
fi

# Добавляем все файлы
echo "📁 Добавляем файлы в git..."
git add .

# Коммитим изменения
echo "💾 Коммитим изменения..."
git commit -m "Full-stack L'Épatage site ready for deployment"

# Запрашиваем URL репозитория
echo "🌐 Введите URL вашего GitHub репозитория (например: https://github.com/username/lepatage-react.git):"
read repo_url

# Добавляем remote origin
echo "🔗 Подключаем к GitHub..."
git remote add origin "$repo_url"

# Пушим в main ветку
echo "📤 Пушим код в GitHub..."
git branch -M main
git push -u origin main

echo "✅ GitHub репозиторий подключен!"
echo "🌐 Теперь можете настроить деплой на Vercel через веб-интерфейс"
echo "🔗 Перейдите на: https://vercel.com/ilyas-projects-ea9a5350"
echo "📝 Создайте новый проект и подключите GitHub репозиторий"
