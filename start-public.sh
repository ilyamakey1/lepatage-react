#!/bin/bash

echo "🚀 Starting L'Épatage with Public Internet Access..."
echo ""
echo "Выберите способ доступа через интернет:"
echo "1) Ngrok (требует регистрацию на ngrok.com, бесплатно)"
echo "2) Localtunnel (без регистрации, простой)"
echo "3) Cloudflare Tunnel (требует регистрацию, бесплатно и стабильно)"
echo ""
read -p "Введите номер (1-3): " choice

# Build the project first
echo "📦 Building project..."
npm run build

# Start the server in background
echo "🌐 Starting server on port 3001..."
npm run server:prod &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Server is running on http://localhost:3001"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID 2>/dev/null || true
    pkill -f "ngrok" 2>/dev/null || true
    pkill -f "lt" 2>/dev/null || true
    pkill -f "cloudflared" 2>/dev/null || true
    echo "✅ Cleaned up"
    exit 0
}

trap cleanup SIGINT SIGTERM

case $choice in
    1)
        # Ngrok
        if ! command -v ngrok &> /dev/null; then
            echo "❌ ngrok not found. Installing..."
            echo "📝 Сначала установите ngrok:"
            echo "   brew install ngrok/ngrok/ngrok"
            echo "   или скачайте с https://ngrok.com/download"
            echo ""
            echo "🔑 Затем зарегистрируйтесь на https://ngrok.com и получите токен"
            echo "   ngrok config add-authtoken YOUR_TOKEN"
            kill $SERVER_PID 2>/dev/null || true
            exit 1
        fi
        
        echo "🌍 Starting ngrok tunnel..."
        echo "📋 Публичный URL будет показан ниже:"
        echo ""
        ngrok http 3001
        ;;
        
    2)
        # Localtunnel
        if ! command -v lt &> /dev/null; then
            echo "📦 Installing localtunnel..."
            npm install -g localtunnel
        fi
        
        echo "🌍 Starting localtunnel..."
        echo "📋 Публичный URL будет показан ниже:"
        echo ""
        lt --port 3001
        ;;
        
    3)
        # Cloudflare Tunnel
        if ! command -v cloudflared &> /dev/null; then
            echo "📦 Installing cloudflared..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install cloudflare/cloudflare/cloudflared
            else
                echo "❌ Установите cloudflared вручную: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
                kill $SERVER_PID 2>/dev/null || true
                exit 1
            fi
        fi
        
        echo "🌍 Starting Cloudflare Tunnel..."
        echo "📋 Публичный URL будет показан ниже:"
        echo ""
        cloudflared tunnel --url http://localhost:3001
        ;;
        
    *)
        echo "❌ Неверный выбор"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
        ;;
esac
