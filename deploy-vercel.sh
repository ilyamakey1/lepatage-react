#!/bin/bash

echo "🚀 Deploying L'Épatage to Vercel..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project
echo "📦 Building project..."
npx vite build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌍 Your site is now live on the internet!"
echo "🔗 Check the URL above for your live site"
