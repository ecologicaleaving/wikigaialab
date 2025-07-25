import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-nextauth';

export interface ApiUser {
  id: string;
  email: string;
  name?: string;
  isTestUser?: boolean;
}

/**
 * Get authenticated user from either NextAuth session or test authentication
 */
export async function getApiUser(request: NextRequest): Promise<ApiUser | null> {
  try {
    // First, try NextAuth session
    const session = await auth();
    if (session?.user) {
      return {
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || undefined,
        isTestUser: false
      };
    }

    // Then, check for test authentication
    const testAuthCookie = request.cookies.get('test-auth');
    if (testAuthCookie?.value) {
      // For test auth, we need to get the session from localStorage-equivalent data
      // Since we can't access localStorage from server, we'll create a test user based on cookie
      return {
        id: 'test-playwright-user',
        email: 'playwright-test@wikigaialab.com',
        name: 'playwright-user',
        isTestUser: true
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting API user:', error);
    return null;
  }
}

/**
 * Middleware to require authentication for API routes
 */
export async function requireAuth(request: NextRequest): Promise<{ user: ApiUser } | { error: Response }> {
  const user = await getApiUser(request);
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  return { user };
}