#!/bin/bash

echo "🚀 Starting L'Épatage with Public Access..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Installing..."
    npm install -g ngrok
fi

# Build the project
echo "📦 Building project..."
npm run build

# Start the server in background
echo "🌐 Starting server on port 3001..."
npm run server &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Server is running!"
    
    # Start ngrok
    echo "🌍 Starting ngrok tunnel..."
    ngrok http 3001
    
    # Cleanup when ngrok stops
    echo "🧹 Cleaning up..."
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    kill $SERVER_PID
    exit 1
fi
