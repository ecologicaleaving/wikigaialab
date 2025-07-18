#!/bin/bash
# WikiGaiaLab Development Setup Script

echo "🚀 Setting up WikiGaiaLab development environment..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with the required environment variables."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Check if build is needed
if [ ! -d ".next" ]; then
    echo "🏗️  Building application..."
    pnpm build
fi

# Check if favicon exists
if [ ! -f "public/favicon.ico" ]; then
    echo "🖼️  Creating favicon..."
    cp public/icon.svg public/favicon.ico
fi

# Check if apple-touch-icon exists
if [ ! -f "public/apple-touch-icon.png" ]; then
    echo "🍎 Creating apple-touch-icon..."
    cp public/icon.svg public/apple-touch-icon.png
fi

# Check if manifest.json exists
if [ ! -f "public/manifest.json" ]; then
    echo "📱 Creating PWA manifest..."
    cat > public/manifest.json << 'EOF'
{
  "name": "WikiGaiaLab",
  "short_name": "WikiGaiaLab",
  "description": "Community-driven problem solving platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "categories": [
    "productivity",
    "social",
    "utilities"
  ],
  "lang": "it",
  "dir": "ltr",
  "scope": "/",
  "prefer_related_applications": false
}
EOF
fi

echo "✅ Development environment setup complete!"
echo "🎯 Starting development server..."
echo "📱 Application will be available at: http://localhost:3000"
echo "🔍 Admin dashboard: http://localhost:3000/admin"
echo "📊 Monitoring: http://localhost:3000/admin/monitoring"
echo "🎨 Volantino Generator: http://localhost:3000/apps/volantino-generator"
echo ""
echo "🔧 To create the database schema, visit: http://localhost:3000/admin/seed"
echo ""

# Start the development server
pnpm dev