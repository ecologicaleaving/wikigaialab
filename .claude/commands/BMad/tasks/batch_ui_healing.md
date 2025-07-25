# Batch UI Healing System

## Configuration
```
APPLICATION_URL = "[YOUR_APPLICATION_URL]"
DOCS_PATH = "/docs/ui/"
SCORE_THRESHOLD = 8
SCREENS_FILE = "/docs/ui/page-list.md"  # File con elenco schermate
```

## Auto-Discovery & File Creation
If `/docs/ui/page-list.md` doesn't exist:
1. **Study the docs directory** to understand the application structure
2. **Analyze the codebase** to discover all available routes/pages
3. **Auto-generate** the page-list.md file with discovered screens
4. **Save** to `/docs/ui/page-list.md` for future use

## Input File Format
The system will create/read `/docs/ui/page-list.md` with this format:

```
# Format: URL_PATH | SCREEN_NAME | DESCRIPTION
/homepage | homepage | Main landing page
/login | login | User authentication screen  
/dashboard | dashboard | User dashboard after login
/profile | profile | User profile management
/settings | settings | Application settings
/product/123 | product-detail | Product detail page
# Comments start with #
```

## Quick Start Command

**Per avviare immediatamente l'iterazione totale, usa:**

```
*ux-total-iteration
```

Questo comando attiverà automaticamente il processo di UI Healing per tutte le schermate. Se il file `/docs/ui/page-list.md` non esiste, lo creerà automaticamente analizzando docs e codebase.

---

## Batch Processing Steps

### Step 1: File Reading
- Read and parse the `SCREENS_FILE` 
- Extract URL paths, screen names, and descriptions
- Skip comment lines (starting with #)
- Validate each entry format

### Step 2: Batch Screenshot Capture
For each screen in the file:
- Navigate to `APPLICATION_URL + URL_PATH` using `browser_navigate`
- Wait for page load with `browser_wait_for(time=3)`
- Capture screenshot with `browser_take_screenshot(filename="{SCREEN_NAME}.png")`
- Log capture status for tracking

### Step 3: Batch Evaluation
Reference the directory `/docs/ui/` and analyze the files:
- `front_end_spec.md` - Technical specifications
- `identity.md` & `identity_template.md` - Brand identity guidelines
- `interactivity.md` & `interactivity_template.md` - UX interaction rules
- `logo-guidelines.md` - Logo usage and branding
- `wikigaiaLogo.png` - Visual brand reference

For each captured screenshot:
- Grade objectively against standards (1-10 scale)
- Document specific compliance issues
- Record detailed reasoning for each score

### Step 4: Batch Healing Process
For each screen with score < 8/10:
1. Document specific issues vs style guide standards
2. Apply fixes or generate detailed recommendations
3. Take new screenshot of updated screen
4. Re-evaluate until score ≥ 8/10
5. Track before/after states

### Step 5: Consolidated Report
Generate comprehensive batch report:
- **Summary Dashboard**: Overview of all screens processed
- **Score Matrix**: Grid showing all screens and their final scores
- **Issues Catalog**: All problems found across screens
- **Healing Log**: Changes made during healing process
- **Before/After Gallery**: Visual evidence of improvements
- **Recommendations**: Remaining items requiring attention

## Batch Report Template

```
# BATCH UI HEALING REPORT
Generated: [TIMESTAMP]
Screens Processed: [COUNT]
Average Score: [X.X]/10
Screens Healed: [COUNT]

## SCORE SUMMARY
┌─────────────────────────┬───────┬────────┬──────────┐
│ Screen                  │ Score │ Status │ Issues   │
├─────────────────────────┼───────┼────────┼──────────┤
│ homepage                │  9/10 │   ✅   │    1     │
│ login                   │  7/10 │   🔄   │    3     │
│ dashboard               │  8/10 │   ✅   │    2     │
└─────────────────────────┴───────┴────────┴──────────┘

## CRITICAL ISSUES FOUND
1. [Screen]: [Issue description]
2. [Screen]: [Issue description]

## HEALING ACTIONS TAKEN
1. [Screen]: [Action description]
2. [Screen]: [Action description]
```

## Advanced Configuration

### Custom Viewport Testing
```
VIEWPORTS = [
  {width: 1920, height: 1080, name: "desktop"},
  {width: 768, height: 1024, name: "tablet"},
  {width: 375, height: 667, name: "mobile"}
]
```

### Parallel Processing (Optional)
```
BATCH_SIZE = 5           # Process N screens simultaneously
DELAY_BETWEEN_BATCHES = 2000  # ms delay between batches
```

### Custom Scoring Weights
```
SCORING_WEIGHTS = {
  layout_compliance: 0.3,
  visual_design: 0.3,
  ux_rules: 0.3,
  accessibility: 0.1
}
```

---

## How to Run Batch Iteration

### Method 1: Quick Start
```
*ux-batch-iteration
```

### Method 2: Manual Steps

#### 1. Prerequisites
```bash
claude mcp add playwright npx @playwright/mcp@latest
```

#### 2. Prepare Input File
Create `screens-list.txt` in your project directory with the screen definitions.

#### 3. Launch Claude Code
```bash
claude code
```

#### 4. Configure Settings
Update `APPLICATION_URL` and `SCREENS_FILE` path in the configuration.

#### 5. Start Batch Process
```
START batch UI Healing process now.

Begin by reading the screens list file and processing each screen through the complete healing cycle.
```

### 6. Monitoring Batch Progress
The system will show:
- Current screen being processed (X of Y)
- Real-time scores as they're calculated
- Healing actions being applied
- Progress through the batch

### 7. Final Output
- Consolidated report with all results
- Before/after screenshots organized by screen
- Actionable recommendations for remaining issues
- Export data for external tracking

**Ready to batch heal?** Update the config and run `*ux-batch-iteration`! 🚀

## Example Screens File

```
# WikiGaia Application Screens
/home | home | Main homepage
/login | login | User authentication
/signup | signup | User registration  
/dashboard | dashboard | User dashboard
/profile | profile | Profile management
/settings | settings | User settings
/help | help | Help documentation
/about | about | About page
/contact | contact | Contact form
/search | search | Search interface
/results | results | Search results page
```