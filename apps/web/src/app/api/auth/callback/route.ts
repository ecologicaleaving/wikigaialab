import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Callback API Route
 * Redirects to NextAuth callback since we migrated from Supabase
 */
export async function GET(request: NextRequest) {
  // Redirect to NextAuth callback endpoint
  return NextResponse.redirect(new URL('/api/auth/callback/google', request.url));
}

/**
 * POST handler for OAuth callback
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}