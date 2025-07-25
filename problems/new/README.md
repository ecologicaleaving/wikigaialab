# WikiGaiaLab Batch UI Healing System - /problems/new Focus

## Overview

This directory contains a comprehensive **Interactive Batch UI Healing System** specifically configured for the WikiGaiaLab `/problems/new` page (Story Creation Form). The system evaluates UI components against WikiGaia brand guidelines and artisan laboratory design principles, providing real-time feedback and automated healing recommendations.

## Quick Start

### 1. Prerequisites
```bash
# Ensure development server is running
cd apps/web
npm run dev

# Verify server is accessible at http://localhost:3000
```

### 2. Run Interactive Batch Healing
```bash
# From project root
./problems/new/run-batch-healing.sh
```

### 3. Alternative: Run Individual Components

**Interactive Configuration:**
```bash
node problems/new/batch-ui-healing-config.js
```

**Playwright Evaluation:**
```bash
cd apps/web
npx playwright test ../../../problems/new/playwright-ui-healing.spec.js
```

## System Architecture

### Core Components

#### 1. `ui-healing-specs.md` - Evaluation Specifications
- **Focus Area**: `/problems/new` page evaluation criteria
- **Brand Integration**: WikiGaia colors, typography, logo guidelines
- **Artisan Language**: Italian laboratory metaphors and community messaging
- **Responsive Design**: Mobile, tablet, desktop requirements
- **Scoring System**: 10-point scale with 8.0 threshold

#### 2. `batch-ui-healing-config.js` - Interactive Configuration
- **Mode**: `--interaction --specs /problems/new`
- **Real-time Feedback**: Live evaluation progress
- **Auto-healing**: Automated improvement suggestions
- **Brand Requirements**: WikiGaia color palette and identity
- **Performance Targets**: Load time, accessibility, animation standards

#### 3. `playwright-ui-healing.spec.js` - Automated Testing
- **Screenshot Capture**: Multi-viewport captures (mobile/tablet/desktop)
- **Real Evaluation**: Actual DOM analysis and brand compliance checking
- **Automated Scoring**: Comprehensive evaluation against specifications
- **Detailed Reporting**: JSON and Markdown reports with actionable insights

#### 4. `run-batch-healing.sh` - Complete Automation
- **Environment Setup**: Checks development server and dependencies
- **Full Pipeline**: Configuration → Screenshots → Evaluation → Reporting
- **Interactive Output**: Real-time progress and results
- **Summary Generation**: Comprehensive batch report

## Evaluation Criteria

### Visual Design Compliance (30% weight)
- **Brand Integration**: WikiGaia logo positioning and colors (#00B894, #00695C)
- **Layout & Spacing**: 12-column grid, 24px spacing, 4px multiples
- **Typography**: Inter font family, proper hierarchy and line-heights

### UX & Interaction Design (30% weight)
- **Artisan Laboratory Language**: Italian workshop metaphors and community terms
- **Form Interaction Patterns**: Intelligent validation, encouraging feedback
- **Micro-interactions**: Smooth animations, responsive states

### Laboratory Workshop Environment (25% weight)
- **Storytelling Context**: Workshop tips and laboratory atmosphere
- **Community Integration**: Problem→solution messaging, voting system references
- **Visual Atmosphere**: Warm gradients, organic animations, craftsmanship feeling

### Technical Implementation (15% weight)
- **Code Quality**: React structure, TypeScript, error handling
- **Performance**: Sub-3s load times, 100ms interaction response, 60fps animations
- **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support

## Scoring System

### Score Breakdown (Total: 10 points)
- **8.0+**: Meets quality standards (passing threshold)
- **9.0+**: Excellence target
- **Below 8.0**: Requires healing/improvement

### Viewport Testing
- **Mobile** (375x667): Touch-friendly, vertical layout
- **Tablet** (768x1024): Balanced layout, touch optimization
- **Desktop** (1920x1080): Full feature set, hover states

## Output Structure

```
problems/new/ui-healing-output/
├── problems-new-mobile-[timestamp].png
├── problems-new-tablet-[timestamp].png
├── problems-new-desktop-[timestamp].png
├── evaluation-mobile-[timestamp].json
├── evaluation-tablet-[timestamp].json
├── evaluation-desktop-[timestamp].json
├── batch-healing-report.md
└── interactive-healing-report.json
```

## Interactive Features

### Real-time Feedback
- Live progress updates during evaluation
- Immediate score calculation and status
- Interactive healing recommendations

### Automated Healing
- Issue identification with specific recommendations
- Priority-based healing actions (HIGH/MEDIUM/LOW)
- Before/after comparison capabilities

### Comprehensive Reporting
- Multi-format reports (JSON, Markdown)
- Visual evidence with screenshots
- Actionable improvement suggestions

## Brand Guidelines Integration

### WikiGaia Color Palette
```css
--verde-wikigaia: #00B894;     /* Primary actions */
--verde-scuro: #00695C;        /* Active states */
--verde-natura: #26A69A;       /* Success feedback */
--teal-collaborativo: #4DB6AC; /* Hover states */
--verde-chiaro: #80CBC4;       /* Secondary elements */
--verde-ghiaccio: #B2DFDB;     /* Subtle backgrounds */
--giallo-ecologico: #FFB74D;   /* Important CTAs */
```

### Artisan Laboratory Language
- **Voice**: Caloroso, familiare (warm, familiar)
- **Tone**: Maestro artigiano (master craftsman)
- **Style**: Compagno di laboratorio (workshop companion)
- **Terms**: "laboratorio", "maestro", "compagni", "vicini", "racconta"

## Advanced Configuration

### Custom Thresholds
```javascript
// In batch-ui-healing-config.js
SCORE_THRESHOLD: 8.0,    // Minimum passing score
TARGET_SCORE: 9.0,       // Excellence target
```

### Performance Targets
```javascript
PERFORMANCE_TARGETS: {
  load_time_3g: 3000,      // 3 seconds on 3G
  interaction_response: 100, // 100ms response time
  animation_fps: 60,       // 60fps animations
  accessibility_score: 100  // WCAG AA compliance
}
```

### Authentication
```javascript
TEST_CREDENTIALS: {
  email: "playwright-test@wikigaialab.com",
  password: "PlaywrightTest123!",
  login_url: "/test-login"  // Bypasses OAuth for testing
}
```

## Troubleshooting

### Common Issues

#### Server Not Running
```bash
# Error: Development server not detected
# Solution:
cd apps/web
npm run dev
```

#### Playwright Not Installed
```bash
# Error: Playwright not found
# Solution:
cd apps/web
npm install @playwright/test
npx playwright install
```

#### Authentication Failures
- Verify test credentials in `/test-login` page
- Check if test user exists in database
- Ensure authentication bypass is working

#### Low Scores
- Review specific evaluation details in JSON reports
- Check WikiGaia brand color implementation
- Verify artisan laboratory language usage
- Test responsive design across viewports

## Integration with Development Workflow

### Pre-commit Hooks
```bash
# Add to .husky/pre-commit
./problems/new/run-batch-healing.sh --quick
```

### CI/CD Integration
```yaml
# In GitHub Actions
- name: UI Healing Check
  run: ./problems/new/run-batch-healing.sh --ci-mode
```

### Development Server Integration
```bash
# Watch mode for continuous evaluation
./problems/new/run-batch-healing.sh --watch
```

## Contributing

### Adding New Evaluation Criteria
1. Update `ui-healing-specs.md` with new requirements
2. Modify evaluator classes in `playwright-ui-healing.spec.js`
3. Adjust scoring weights in configuration
4. Test with various page states

### Extending to Other Pages
1. Copy directory structure to `/pages/[page-name]/`
2. Update configuration URLs and specifications
3. Modify evaluation criteria for page-specific requirements
4. Run comprehensive testing suite

---

## Results Interpretation

### Score Meanings
- **9.0-10.0**: ✨ Exceptional - Exceeds WikiGaia standards
- **8.0-8.9**: ✅ Good - Meets all requirements
- **7.0-7.9**: ⚠️ Acceptable - Minor improvements needed
- **6.0-6.9**: 🔧 Needs Work - Several issues to address
- **Below 6.0**: ❌ Critical - Major redesign required

### Healing Priority
1. **Critical Issues**: Brand violations, accessibility failures
2. **Important**: UX patterns, language consistency
3. **Enhancement**: Performance optimizations, visual polish

---

*This Interactive Batch UI Healing System ensures the `/problems/new` page maintains WikiGaia's artisan laboratory identity while providing an exceptional user experience for community members sharing their problems and contributing to collaborative solutions.*