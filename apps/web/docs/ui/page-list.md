# UI Pages List & Authentication
*WikiGaiaLab Animation-Focused Batch Healing*

## AUTHENTICATION CREDENTIALS
TEST_EMAIL = "playwright-ui-test@tempmail.dev"
TEST_PASSWORD = "UIHealing2025!"
LOGIN_URL = "https://wikigaialab.vercel.app/login"
SIGNUP_URL = "https://wikigaialab.vercel.app/login"
AUTH_METHOD = "login"

## SCREENS LIST
# Format: URL_PATH | SCREEN_NAME | DESCRIPTION | AUTH_REQUIRED | PRIORITY

# Critical Pages (Animation Priority)
/ | homepage | Main landing page with hero animations | false | critical
/login | login | User authentication with branded interactions | false | critical
/dashboard | dashboard | User dashboard with data animations | true | critical

# High Priority Pages  
/problems | problems | Problems list with card interactions | false | high
/problems/new | problem-creation | Problem creation form with feedback | true | high
/profile | profile | User profile with interactive elements | true | high
/admin | admin | Admin panel with data visualizations | true | high

# Medium Priority Pages
/apps | apps | Applications catalog with hover effects | false | medium
/help | help | Help documentation with smooth scrolling | false | medium
/settings | settings | Settings page with toggle animations | true | medium
/analytics | analytics | Analytics dashboard with chart animations | true | medium

# Low Priority Pages
/terms | terms | Terms page with reading enhancements | false | low
/test-css | test-css | CSS testing page for development | false | low

## ANIMATION-SPECIFIC CONFIGURATION
# Animation focus flag automatically applied
ANIMATIONS_FOCUS = true
ANIMATION_THRESHOLD = 85
TARGET_FPS = 60
WIKIGAIA_MOTION_DNA = true

## EXPECTED ANIMATION IMPROVEMENTS
# Pages will be enhanced with:
# - Entrance animations (staggered reveals)
# - Interaction animations (hover, click, focus)
# - Transition animations (page/state changes)  
# - Micro-interactions (icons, scroll effects)
# - Brand-aligned motion using WikiGaia principles