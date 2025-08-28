#!/bin/bash

echo "🚀 Deploying L'Épatage to Vercel with Full Stack..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo "📝 This will create a new project or update existing one"
echo "🔑 Make sure you're logged into Vercel with your GitHub account"

# Deploy with production flag
vercel --prod

echo "✅ Deployment complete!"
echo "🌍 Your full-stack site is now live on Vercel!"
echo "🗄️ Database will be automatically initialized on first request"
echo "🔗 Check the URL above for your live site"
echo ""
echo "📋 Next steps:"
echo "1. Set up Turso database (optional but recommended)"
echo "2. Configure environment variables in Vercel dashboard"
echo "3. Connect your custom domain"
