#!/bin/bash

# WikiGaiaLab Batch UI Healing System
# Interactive Mode with Focus on /problems/new
# Usage: ./problems/new/run-batch-healing.sh

set -e

echo "🚀 WikiGaiaLab Batch UI Healing System"
echo "📋 Mode: Interactive --specs /problems/new"
echo "🎯 Target: Story Creation Form (/problems/new)"
echo "==============================================="
echo ""

# Configuration
PROJECT_ROOT="/Users/davidecrescentini/00-Progetti/000-WikiGaiaLab"
OUTPUT_DIR="$PROJECT_ROOT/problems/new/ui-healing-output"
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
echo "📁 Setting up output directory..."
mkdir -p "$OUTPUT_DIR"

# Check if development server is running
echo "🔍 Checking if development server is running..."
if ! curl -s "$BASE_URL" > /dev/null; then
    echo -e "${YELLOW}⚠️  Development server not detected at $BASE_URL${NC}"
    echo "   Please start the server with: npm run dev"
    echo "   Then run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Development server is running${NC}"
echo ""

# Check Playwright installation
echo "🎭 Checking Playwright installation..."
if ! command -v npx playwright &> /dev/null; then
    echo -e "${YELLOW}⚠️  Playwright not found. Installing...${NC}"
    cd "$PROJECT_ROOT/apps/web"
    npm install @playwright/test
    npx playwright install
fi

echo -e "${GREEN}✅ Playwright is ready${NC}"
echo ""

# Run the interactive configuration
echo "⚙️  Running interactive configuration..."
cd "$PROJECT_ROOT"
node problems/new/batch-ui-healing-config.js

echo ""

# Run Playwright UI healing tests
echo "🎭 Starting Playwright UI healing evaluation..."
echo "   Target: /problems/new"
echo "   Viewports: Mobile, Tablet, Desktop"
echo "   Mode: Interactive with real-time feedback"
echo ""

cd "$PROJECT_ROOT/apps/web"

# Run the Playwright tests
npx playwright test ../../../problems/new/playwright-ui-healing.spec.js \
  --reporter=line \
  --timeout=60000 \
  --retries=1

# Check if tests completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ UI Healing evaluation completed successfully!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some evaluations may need attention${NC}"
fi

echo ""

# Generate final summary
echo "📊 Generating final summary report..."

cd "$PROJECT_ROOT"

# Create summary script
cat > "$OUTPUT_DIR/generate-summary.js" << 'EOF'
const fs = require('fs');
const path = require('path');

const outputDir = process.argv[2];
const files = fs.readdirSync(outputDir);

const evaluationFiles = files.filter(f => f.startsWith('evaluation-') && f.endsWith('.json'));
const screenshots = files.filter(f => f.endsWith('.png'));

console.log('\n📊 BATCH UI HEALING SUMMARY');
console.log('=====================================');
console.log(`📄 Page Evaluated: /problems/new`);
console.log(`📸 Screenshots Captured: ${screenshots.length}`);
console.log(`🔍 Evaluations Completed: ${evaluationFiles.length}`);

if (evaluationFiles.length > 0) {
    const evaluations = evaluationFiles.map(file => {
        return JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
    });
    
    const avgScore = evaluations.reduce((sum, e) => sum + e.scores.total, 0) / evaluations.length;
    const passCount = evaluations.filter(e => e.status === 'PASS').length;
    
    console.log(`📊 Average Score: ${avgScore.toFixed(1)}/10`);
    console.log(`✅ Passing Evaluations: ${passCount}/${evaluations.length}`);
    
    console.log('\n📱 By Viewport:');
    ['mobile', 'tablet', 'desktop'].forEach(viewport => {
        const viewportEvals = evaluations.filter(e => e.viewport === viewport);
        if (viewportEvals.length > 0) {
            const vpAvg = viewportEvals.reduce((sum, e) => sum + e.scores.total, 0) / viewportEvals.length;
            const status = vpAvg >= 8.0 ? '✅' : '⚠️';
            console.log(`  ${status} ${viewport}: ${vpAvg.toFixed(1)}/10`);
        }
    });
    
    console.log('\n🎯 Recommendations:');
    if (avgScore >= 9.0) {
        console.log('  ✨ Excellent! Page meets excellence standards.');
    } else if (avgScore >= 8.0) {
        console.log('  ✅ Good! Page meets minimum standards.');
        console.log('  🚀 Continue improving towards excellence (9.0+).');
    } else {
        console.log('  ⚠️  Needs improvement to meet standards (8.0+).');
        console.log('  🔧 Review evaluation details for specific issues.');
    }
} else {
    console.log('⚠️  No evaluation data found.');
}

console.log('\n📁 Output Files:');
files.forEach(file => {
    console.log(`  📄 ${file}`);
});

console.log(`\n💾 All files saved to: ${outputDir}`);
console.log('');
EOF

# Run summary generation
node "$OUTPUT_DIR/generate-summary.js" "$OUTPUT_DIR"

# Clean up temporary files
rm "$OUTPUT_DIR/generate-summary.js"

echo "🎉 WikiGaiaLab Batch UI Healing completed!"
echo ""
echo "📁 Results saved to: $OUTPUT_DIR"
echo "📄 Review the batch-healing-report.md for detailed analysis"
echo "📸 Screenshots available for visual review"
echo ""

# Optional: Open output directory (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔍 Opening output directory..."
    open "$OUTPUT_DIR"
fi

echo "✨ Interactive UI Healing session complete!"