#!/bin/bash

echo "🚀 Starting L'Épatage Production Server..."

# Build the project
echo "📦 Building project..."
npm run build

# Start the server
echo "🌐 Starting server on port 3001..."
npm run server

echo "✅ Server is running!"
echo "   ➜ Local:   http://localhost:3001"
echo "   ➜ Network: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "Press Ctrl+C to stop the server"
