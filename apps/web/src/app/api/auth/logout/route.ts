import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout API Route
 * Redirects to NextAuth signout since we migrated from Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Redirect to NextAuth signout endpoint
    return NextResponse.redirect(new URL('/api/auth/signout', request.url));
    
  } catch (error) {
    console.error('Logout processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for logout (not supported)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to logout.' },
    { status: 405 }
  );
}