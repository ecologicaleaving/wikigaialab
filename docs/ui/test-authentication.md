# Test Authentication Setup for Playwright

## Overview

The `/test-login` page provides a dedicated authentication endpoint for Playwright automation testing, bypassing the OAuth flow that would otherwise require complex authentication mocking.

## Test Login Page

**URL**: `http://localhost:3000/test-login`

### Features
- ✅ Simple email/password form (no OAuth complexity)
- ✅ Pre-configured test accounts with different roles
- ✅ Automatic session management with localStorage and cookies
- ✅ Success/error feedback for automation validation
- ✅ Quick-fill buttons for test credentials
- ✅ Role-based redirects (admin → `/admin`, user → `/dashboard`)

### Available Test Accounts

| Email | Password | Username | Role | Purpose |
|-------|----------|----------|------|---------|
| `playwright-test@wikigaialab.com` | `PlaywrightTest123!` | `playwright-user` | user | Main automation testing |
| `admin-test@wikigaialab.com` | `AdminTest123!` | `admin-user` | admin | Admin panel testing |
| `demo-user@wikigaialab.com` | `DemoUser123!` | `demo-user` | user | Demo/showcase testing |

## Playwright Integration

### Updated Authentication Flow
```typescript
const AUTH_CONFIG = {
  TEST_EMAIL: 'playwright-test@wikigaialab.com',
  TEST_PASSWORD: 'PlaywrightTest123!',
  LOGIN_URL: 'http://localhost:3000/test-login', // Dedicated test page
};

async function performLogin(page: Page): Promise<boolean> {
  await page.goto(AUTH_CONFIG.LOGIN_URL);
  await page.fill('input[name="email"]', AUTH_CONFIG.TEST_EMAIL);
  await page.fill('input[name="password"]', AUTH_CONFIG.TEST_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Check for success indicators
  const success = await page.locator('text="Successfully logged in"').count() > 0;
  return success;
}
```

### Benefits for UI Healing System
1. **Reliable Authentication**: No external OAuth dependencies
2. **Fast Testing**: Quick login without redirects or external services
3. **Role Testing**: Different user types for comprehensive testing
4. **Session Persistence**: Proper session management for extended test runs
5. **Error Handling**: Clear feedback for debugging authentication issues

## Security Considerations

### Development Only
- ⚠️ **This page should ONLY be available in development/test environments**
- ⚠️ **Never deploy to production** - it bypasses security controls
- ⚠️ **Test credentials are intentionally simple** for automation purposes

### Recommended Deployment Strategy
```typescript
// In production builds, return 404 or redirect
if (process.env.NODE_ENV === 'production') {
  return <NotFound />;
}
```

## Usage Examples

### Basic Playwright Test
```typescript
test('protected page access', async ({ page }) => {
  // Login first
  await page.goto('http://localhost:3000/test-login');
  await page.fill('input[name="email"]', 'playwright-test@wikigaialab.com');
  await page.fill('input[name="password"]', 'PlaywrightTest123!');
  await page.click('button[type="submit"]');
  
  // Wait for success
  await expect(page.locator('text="Successfully logged in"')).toBeVisible();
  
  // Now test protected pages
  await page.goto('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Admin Role Testing
```typescript
test('admin panel access', async ({ page }) => {
  await page.goto('http://localhost:3000/test-login');
  await page.fill('input[name="email"]', 'admin-test@wikigaialab.com');
  await page.fill('input[name="password"]', 'AdminTest123!');
  await page.click('button[type="submit"]');
  
  // Should redirect to admin panel
  await expect(page).toHaveURL(/\/admin/);
});
```

## Session Management

### Storage Methods
The test login sets up authentication in multiple ways for maximum compatibility:

1. **localStorage**: `test-session` with full user data
2. **localStorage**: `auth-token` for API calls
3. **Cookies**: `test-auth` for server-side validation

### Session Data Structure
```json
{
  "user": {
    "id": "test-playwright-user",
    "email": "playwright-test@wikigaialab.com",
    "username": "playwright-user",
    "role": "user",
    "isTestUser": true
  },
  "token": "test-token-1234567890",
  "expiresAt": "2025-07-26T12:00:00.000Z"
}
```

## Integration with UI Healing System

The UI Healing System now automatically:
1. Uses `/test-login` for authentication
2. Handles protected page evaluation
3. Maintains session across multiple page tests
4. Provides detailed logging for authentication steps
5. Gracefully handles authentication failures

This setup enables comprehensive testing of both public and protected pages while maintaining the security of the production OAuth flow.