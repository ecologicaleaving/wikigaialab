# Total UI Healing System

# Total UI Healing System

## Global Configuration Variables

```bash
# =================================================================
# TOTAL UI HEALING SYSTEM - CONFIGURATION
# =================================================================

# APPLICATION SETTINGS
APPLICATION_URL = "https://wikigaialab.vercel.app/"           # Main application URL to test
DOCS_PATH = "/docs/ui/"                              # Path to UI documentation and style guides
SCORE_THRESHOLD = 8                                  # Minimum score required (1-10 scale)
SCREENS_FILE = "/docs/ui/page-list.md"              # File with screen list + auth credentials

# EXECUTION MODE SETTINGS  
SINGLE_PAGE_MODE = false                             # true = single page, false = all pages
TARGET_PAGE = ""                                     # Specific page for single mode (e.g., "/dashboard")

# AUTHENTICATION SETTINGS
AUTH_METHOD = "login"                                # Options: login, storage_state, bypass
LOGIN_URL = "auto-detect"                            # Will auto-detect /login, /signin, /auth endpoints
SIGNUP_URL = "auto-detect"                           # Will auto-detect /signup, /register endpoints  
TEST_EMAIL = "playwright-ui-test@tempmail.dev"       # Default test email (will be used for user creation)
TEST_PASSWORD = "UIHealing2025!"                     # Default secure password (will be used for user creation)
STORAGE_STATE_FILE = "/docs/ui/auth-state.json"      # Browser session storage file
AUTO_CREATE_USER = true                              # Automatically create test user if needed

# PLAYWRIGHT SETTINGS
VIEWPORT_WIDTH = 1920                                # Browser viewport width
VIEWPORT_HEIGHT = 1080                               # Browser viewport height
SCREENSHOT_FORMAT = "PNG"                            # Screenshot format (PNG/JPEG)
HEADLESS_MODE = false                                # Run browser in headless mode
BROWSER_TYPE = "chromium"                            # Browser: chromium, firefox, webkit

# EVALUATION SETTINGS
MANDATORY_REPORTING = true                           # Show detailed reports for every screen
WAIT_FOR_ACKNOWLEDGMENT = true                       # Pause between screens in total mode
BEFORE_AFTER_COMPARISON = true                       # Generate before/after screenshots
DETAILED_FIX_PLANS = true                           # Provide step-by-step fix recommendations

# OUTPUT SETTINGS
OUTPUT_DIR = "/docs/ui/healing-reports/"             # Directory for reports and screenshots
SAVE_SCREENSHOTS = true                              # Save all screenshots to disk
ANNOTATE_ISSUES = true                              # Add visual annotations to screenshots
EXPORT_METRICS = true                               # Export healing metrics to file
```

**📝 SETUP INSTRUCTIONS:**
1. Replace `[YOUR_APPLICATION_URL]` with your app's URL
2. **Authentication settings have smart defaults** - LOGIN_URL and SIGNUP_URL will auto-detect common endpoints
3. **Default test credentials** are ready to use: `playwright-ui-test@tempmail.dev` / `UIHealing2025!`
4. Adjust other settings as needed for your environment

**🔧 AUTO-CONFIGURATION FEATURES:**
- **Smart URL Detection**: Automatically finds `/login`, `/signin`, `/auth`, `/signup`, `/register` endpoints
- **Ready-to-Use Credentials**: Default email/password work immediately for user creation
- **Temporary Email Domain**: Uses `tempmail.dev` for disposable test accounts

## Required Dependencies

### Microsoft Playwright Framework Integration
This system **REQUIRES** Microsoft Playwright for reliable browser automation:
- **Official Repository**: https://github.com/microsoft/playwright
- **MCP Server**: https://github.com/microsoft/playwright-mcp
- **Documentation**: https://playwright.dev/docs/intro

**Installation:**
```bash
claude mcp add playwright npx @playwright/mcp@latest
```

**For all Playwright commands, browser automation techniques, and advanced configuration:**
👉 **Refer to official documentation**: https://github.com/microsoft/playwright-mcp

**Key capabilities needed from Playwright MCP:**
- Browser navigation and page loading
- High-quality screenshot capture (PNG/JPEG)
- Element interaction (click, hover, type)
- Page structure analysis via accessibility tree
- Multi-viewport testing support
- Authentication state management

**Browser Support**: Chromium, Firefox, WebKit - all platforms
**Documentation**: Complete command reference and examples at repository above

## Authentication & Access Management

### Auto-User Creation & Management
If no test user exists for Playwright automation:

**Step A: Create Playwright Test User**
- Navigate to registration/signup page using Playwright navigation
- Generate secure test user credentials (email, username, password)
- Complete registration form automation
- Verify successful account creation

**For detailed authentication commands and examples:**
👉 **See Playwright MCP documentation**: https://github.com/microsoft/playwright-mcp

**Step B: Update Configuration File**
Automatically update `/docs/ui/page-list.md` with new credentials:
- Add authentication section with generated credentials
- Include login URL, creation date, and user status
- Save for reuse across sessions

**Step C: Verify Test User Access**
- Test login flow with created credentials
- Validate access to protected areas
- Save authentication state for session reuse

### Authentication Methods Supported:
1. **Programmatic Login**: Automated form filling and submission
2. **Storage State Persistence**: Save/restore browser sessions
3. **Session Cookies Management**: Automatic cookie handling
4. **API Token Authentication**: localStorage/cookie token management
5. **Environment-Based Credentials**: Secure credential loading

**For implementation details of each method:**
👉 **Complete authentication guide**: https://github.com/microsoft/playwright-mcp

### Authentication Configuration
Add to your healing configuration:

```
## Authentication Setup
AUTH_METHOD = "login"  # Options: login, storage_state, bypass
LOGIN_URL = "https://your-app.com/login"
TEST_EMAIL = "[TEST_EMAIL]"
TEST_PASSWORD = "[TEST_PASSWORD]"
STORAGE_STATE_FILE = "/docs/ui/auth-state.json"
```
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
## Auto-Generated File Structure
The system will create/update the file specified in `SCREENS_FILE` with this format:

```markdown
# UI Pages List & Authentication

## AUTHENTICATION CREDENTIALS
# Auto-generated by Total UI Healing System
TEST_EMAIL = "playwright-test@yourapp.com"
TEST_PASSWORD = "PlaywrightTest123!"
TEST_USERNAME = "playwright-user"
AUTH_METHOD = "login"
LOGIN_URL = "[FROM LOGIN_URL VARIABLE]"
SIGNUP_URL = "[FROM SIGNUP_URL VARIABLE]"
CREATED_DATE = "2025-07-25"
USER_STATUS = "active"

## SCREENS LIST
# Format: URL_PATH | SCREEN_NAME | DESCRIPTION | AUTH_REQUIRED
/homepage | homepage | Main landing page | false
/login | login | User authentication screen | false
/signup | signup | User registration | false
/dashboard | dashboard | User dashboard after login | true
/profile | profile | User profile management | true
/settings | settings | Application settings | true
/admin | admin | Admin panel | true
# Auto-discovered pages will be added here
```

### Credential Security & Management
```bash
# Default credentials are automatically used for user creation:
1. Uses TEST_EMAIL = "playwright-ui-test@tempmail.dev" (disposable email)
2. Uses TEST_PASSWORD = "UIHealing2025!" (secure default password)
3. Auto-detects SIGNUP_URL by testing common registration endpoints
4. Auto-detects LOGIN_URL by testing common login endpoints
5. Tests successful login before proceeding with healing

# User creation process uses default values:
- EMAIL: Uses TEST_EMAIL default or custom value if provided
- PASSWORD: Uses TEST_PASSWORD default or custom value if provided  
- SIGNUP_URL: Auto-detects /signup, /register, /auth/register endpoints
- Strong password validation handling
- Email verification bypass for test environments
- CAPTCHA handling for automated registration
```

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

## Quick Start Commands

**Per l'iterazione completa di tutte le schermate:**
```
*ux-total-iteration
```

**Per l'analisi di una singola pagina:**
```
/ui-single-page-iteration /dashboard
```
```
/ui-single-page-iteration /profile
```
```
/ui-single-page-iteration /settings
```
```
/ui-single-page-iteration https://your-app.com/specific-page
```

**Modalità Supportate:**
- **Total Mode**: `*ux-total-iteration` - Analizza tutte le pagine dell'applicazione automaticamente
- **Single Page Mode**: `/ui-single-page-iteration /path` - Analizza solo la pagina specificata come argomento
- **Same Process**: Stessa autenticazione, valutazione e healing per entrambe le modalità

**Esempi pratici in Claude Code:**
```
/ui-single-page-iteration /dashboard
/ui-single-page-iteration /user/profile
/ui-single-page-iteration /admin/settings
/ui-single-page-iteration /product/123
```

---

## Batch Processing Steps

### Step 1: Auto-Discovery, User Management & Authentication Setup
**For Total Mode (*ux-total-iteration):**
- Check if `SCREENS_FILE` exists
- **AUTO-ENDPOINT DETECTION:**
  - If `LOGIN_URL = "auto-detect"`: Test common endpoints (`/login`, `/signin`, `/auth`) 
  - If `SIGNUP_URL = "auto-detect"`: Test common endpoints (`/signup`, `/register`, `/auth/register`)
  - Update configuration with discovered URLs
- **USER MANAGEMENT:**
  - Check if test user credentials exist in screens file
  - If NO credentials found AND `AUTO_CREATE_USER = true`:
    - Use default `TEST_EMAIL = "playwright-ui-test@tempmail.dev"`
    - Use default `TEST_PASSWORD = "UIHealing2025!"`
    - Navigate to discovered or configured `SIGNUP_URL`
    - Create user with default credentials automatically
  - Update `SCREENS_FILE` with used credentials
- **AUTHENTICATION SETUP:**
  - Attempt login with default or configured credentials at discovered/configured `LOGIN_URL`
  - Verify access to protected areas before proceeding
- **PAGE DISCOVERY:**
  - If screens file NOT exists: Auto-discover all pages and create file
  - If exists: read and parse all screens for processing

**For Single Page Mode (/ui-single-page-iteration /path):**
- Parse the provided page argument (URL path or full URL) and set `TARGET_PAGE`
- Load authentication credentials from `SCREENS_FILE` (create if needed)
- **AUTHENTICATION SETUP:** Same as total mode using global auth settings
- **SINGLE PAGE VALIDATION:**
  - Verify target page exists and is accessible
  - Check if page requires authentication
  - Prepare for single page analysis workflow

### Step 2: Screenshot Capture & Evaluation

**For Total Mode (All Pages):**
For each screen in the `SCREENS_FILE`:

**For Single Page Mode (Target Page Only):**
For the page specified in `TARGET_PAGE`:

**Navigation & Screenshot Capture (Both Modes):**
- Navigate to `APPLICATION_URL + URL_PATH` using Playwright navigation commands
- Wait for complete page loading and element readiness
- Capture screenshots using settings from `VIEWPORT_WIDTH`/`VIEWPORT_HEIGHT` and `SCREENSHOT_FORMAT`
- Generate accessibility structure snapshots for analysis

**For complete screenshot capture commands and options:**
👉 **Playwright MCP Screenshot Guide**: https://github.com/microsoft/playwright-mcp

**MANDATORY: Immediate Evaluation Display (Both Modes)**
**Controlled by `MANDATORY_REPORTING = true` setting**

After each screenshot capture, **IMMEDIATELY DISPLAY**:

1. **Current Screen Analysis**:
   - Screen name and URL
   - Screenshot preview (saved to `OUTPUT_DIR` if `SAVE_SCREENSHOTS = true`)
   - Accessibility structure summary

2. **Detailed Scoring (1-10)**:
   - Layout compliance: X/10 (with specific issues)
   - Visual design adherence: X/10 (with specific issues) 
   - UX rules conformity: X/10 (with specific issues)
   - Accessibility standards: X/10 (with specific issues)
   - **Overall Score**: X/10

3. **Issue Documentation** (if score < `SCORE_THRESHOLD`):
   - List of specific problems found
   - Reference to violated style guide rules in `DOCS_PATH`
   - Visual annotations on screenshots (if `ANNOTATE_ISSUES = true`)
   - Impact assessment (Critical/High/Medium/Low)

4. **Fix Plan** (if score < `SCORE_THRESHOLD` AND `DETAILED_FIX_PLANS = true`):
   - Prioritized action items
   - Specific changes required
   - Code/CSS modifications needed
   - Estimated implementation effort

**For Single Page Mode:** Process stops here if score ≥ `SCORE_THRESHOLD`, continues to healing if below
**For Total Mode:** **WAIT FOR USER ACKNOWLEDGMENT** (if `WAIT_FOR_ACKNOWLEDGMENT = true`) before proceeding to next screen

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

**For Total Mode (All Pages):**
Generate comprehensive batch report covering all processed screens:

**For Single Page Mode:**
Generate focused report for the analyzed page:

**Report Structure (Both Modes):**

1. **Executive Summary**:
   - **Total Mode**: Number of screens processed, average score, critical issues across app
   - **Single Page**: Target page analysis, final score, issue resolution status

2. **Detailed Analysis**:
   - **Total Mode**: Score matrix for all screens, cross-page consistency issues
   - **Single Page**: Deep-dive analysis of the target page, detailed fix implementation

3. **Visual Evidence**:
   - **Total Mode**: Gallery of all before/after screenshots organized by screen
   - **Single Page**: Complete before/after documentation for target page

4. **Actionable Recommendations**:
   - **Total Mode**: Site-wide improvements, pattern fixes, priority roadmap
   - **Single Page**: Specific remaining tasks, related pages that may need similar fixes

5. **Metrics & Tracking**:
   - **Total Mode**: Overall site health score, improvement percentages per screen
   - **Single Page**: Improvement metrics, compliance percentage, time to resolution

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

## How to Run Total Iteration

### Method 1: Quick Start
```
*ux-total-iteration
```

### Method 2: Manual Steps

#### 1. Prerequisites - Microsoft Playwright MCP
**MANDATORY**: Install Microsoft Playwright MCP server
```bash
claude mcp add playwright npx @playwright/mcp@latest
```

**Verify installation**: The following Playwright commands must be available:
- `browser_navigate` - Navigate to URLs
- `browser_take_screenshot` - Capture screen images  
- `browser_snapshot` - Get page accessibility structure
- `browser_wait_for` - Wait for page loading
- `browser_click`, `browser_hover` - Interact with elements

## Playwright Implementation Guidelines

### Essential Capabilities Required
This system leverages these key Playwright features:
- **Cross-browser automation**: Chromium, Firefox, WebKit support
- **Auto-wait functionality**: Automatic element readiness detection
- **High-quality screenshot capture**: PNG/JPEG with customizable options
- **Interactive state testing**: Hover, focus, error state automation
- **Accessibility tree analysis**: Structured data for LLM processing
- **Browser context isolation**: Clean test environments
- **Authentication state management**: Session persistence and reuse

### Configuration & Best Practices
**For complete implementation details, including:**
- Screenshot quality optimization techniques
- Multi-viewport testing strategies  
- Authentication flow automation
- Element interaction best practices
- Error handling and debugging
- Performance monitoring
- Cross-browser compatibility testing

👉 **Complete Implementation Guide**: https://github.com/microsoft/playwright-mcp

### Advanced Features Available
- **Network request monitoring** during page analysis
- **Console message capture** for debugging
- **Trace generation** for detailed execution logs
- **Custom viewport configurations** for responsive testing
- **Element-specific screenshot capture** for component analysis
- **JavaScript evaluation** for dynamic state testing

**Detailed command syntax and examples:**
👉 **Official Documentation**: https://github.com/microsoft/playwright

#### 2. Auto-User Creation (Optional)
**Controlled by `AUTO_CREATE_USER = true` setting**

The system will **automatically create a test user** using default credentials if none exist in `SCREENS_FILE`.

**Automatic Process using Default Values:**
- Detects missing authentication credentials in `SCREENS_FILE`
- Uses smart endpoint detection for `SIGNUP_URL` (tests `/signup`, `/register`, `/auth/register`)
- Creates user with default credentials:
  - **Email**: `TEST_EMAIL = "playwright-ui-test@tempmail.dev"`
  - **Password**: `TEST_PASSWORD = "UIHealing2025!"`
- Completes registration via browser automation
- Updates `SCREENS_FILE` with the used credentials
- Tests login at auto-detected `LOGIN_URL` to verify account works

**Custom Override:**
If you want different credentials, modify the global configuration:
```bash
TEST_EMAIL = "your-custom-test@yourapp.com"
TEST_PASSWORD = "YourCustomPassword123!"  
LOGIN_URL = "https://your-app.com/custom-login"
AUTO_CREATE_USER = true  # Still auto-creates, but with your values
```

**Zero Configuration Mode:**
Leave defaults as-is and the system works immediately:
- ✅ Uses disposable email domain for safety
- ✅ Uses secure default password
- ✅ Auto-detects login/signup endpoints
- ✅ Creates user and starts healing automatically

#### 3. Launch Claude Code
```bash
claude code
```

#### 4. Configure Settings
Update `APPLICATION_URL` in the configuration.

#### 5. Start Total Process
```
START total UI Healing process now.

Begin by checking for /docs/ui/page-list.md and creating it if needed, then process each screen through the complete healing cycle.
```

### 6. Monitoring Total Progress
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

**Ready for total or single page healing with mandatory reporting?** Update the APPLICATION_URL and run your preferred command! 🚀

## System Integration Summary

This Total UI Healing System provides **comprehensive evaluation and fix reporting** with **flexible analysis modes**:

✅ **Dual Execution Modes**: Total iteration (`*ux-total-iteration`) or single page (`*ux-single-page /path`)  
✅ **Mandatory Evaluation Display**: Every screen gets detailed scoring and issue analysis  
✅ **Comprehensive Fix Plans**: Step-by-step remediation with priorities and effort estimates  
✅ **Before/After Documentation**: Visual evidence of all improvements  
✅ **Reliable Automation**: Microsoft Playwright's cross-browser capabilities  
✅ **Automatic User Management**: Self-configuring authentication  
✅ **Complete Documentation**: All commands and examples in official repositories  

## Usage Examples

**Analyze entire application:**
```
*ux-total-iteration
```

**Analyze specific pages:**
```
*ux-single-page /dashboard
*ux-single-page /profile
*ux-single-page /admin/settings
*ux-single-page https://your-app.com/special-page
```

## Documentation References

**Complete Implementation Details:**
- **Playwright MCP Commands**: https://github.com/microsoft/playwright-mcp
- **Playwright Framework**: https://github.com/microsoft/playwright  
- **Official Documentation**: https://playwright.dev/docs/intro

**No commands are duplicated here - refer to official repositories for:**
- Detailed command syntax and parameters
- Advanced configuration options  
- Troubleshooting and debugging guides
- Best practices and optimization techniques
- Complete API reference and examples

## Example Screens File

Example of auto-generated file at `SCREENS_FILE` location:

```markdown
# UI Pages List & Authentication

## AUTHENTICATION CREDENTIALS
# Auto-generated by Total UI Healing System using global configuration defaults
TEST_EMAIL = "playwright-ui-test@tempmail.dev"       # From TEST_EMAIL default
TEST_PASSWORD = "UIHealing2025!"                     # From TEST_PASSWORD default  
TEST_USERNAME = "playwright-user"                    # Auto-generated
AUTH_METHOD = "login"                                # From AUTH_METHOD setting
LOGIN_URL = "https://your-app.com/login"             # Auto-detected or from LOGIN_URL
SIGNUP_URL = "https://your-app.com/signup"           # Auto-detected or from SIGNUP_URL
CREATED_DATE = "2025-07-25"                          # Auto-generated
USER_STATUS = "active"                               # Auto-set after successful creation

## SCREENS LIST
# Format: URL_PATH | SCREEN_NAME | DESCRIPTION | AUTH_REQUIRED
/home | home | Main homepage | false
/about | about | About page | false
/contact | contact | Contact form | false
/login | login | User authentication | false
/signup | signup | User registration | false
/dashboard | dashboard | User dashboard | true
/profile | profile | Profile management | true
/settings | settings | User settings | true
/help | help | Help documentation | true
/admin | admin | Admin panel | true
/search | search | Search interface | true
/results | results | Search results | true
# Additional pages discovered automatically during analysis
```

**🎯 DEFAULT VALUES BEHAVIOR:**
- **Email**: Uses `playwright-ui-test@tempmail.dev` (disposable domain for testing)
- **Password**: Uses `UIHealing2025!` (secure default, can be customized)
- **URLs**: Auto-detects login/signup endpoints or uses configured values
- **Ready to run**: No placeholder replacement needed - works out of the box!