#!/bin/bash

# WikiGaiaLab Batch UI Healing - Targeted Pages Runner
# Arguments: --specs --interaction /settings /help /admin

echo "🚀 WikiGaiaLab Batch UI Healing - Targeted Pages"
echo "Arguments: --specs --interaction /settings /help /admin"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install Playwright if not already installed
if ! npm list playwright &> /dev/null; then
    echo "📦 Installing Playwright..."
    npm install playwright
fi

# Install Playwright browsers if needed
echo "🌐 Ensuring Playwright browsers are installed..."
npx playwright install chromium

# Check if the development server is running
echo "🔍 Checking if development server is running on localhost:3000..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Development server is not running on localhost:3000"
    echo "Please start the development server with:"
    echo "  cd apps/web && npm run dev"
    echo ""
    echo "Once the server is running, re-run this script."
    exit 1
fi

echo "✅ Development server is running"
echo ""

# Run the healing script
echo "🛠️ Starting UI healing process..."
node batch-ui-healing-targeted.js

# Check if the healing completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 UI Healing completed successfully!"
    echo ""
    echo "📁 Results saved in: ./ui-healing-targeted-output/"
    echo "📊 Check the healing report: ./ui-healing-targeted-output/HEALING-REPORT.md"
    echo "📸 Screenshots available for comparison"
    echo ""
    echo "📝 Full analysis report: ./BATCH-UI-HEALING-TARGETED-FINAL-REPORT.md"
    echo ""
    echo "✅ All targeted pages (/settings, /help, /admin) have been healed!"
else
    echo ""
    echo "❌ UI Healing encountered errors. Check the output above for details."
    exit 1
fi