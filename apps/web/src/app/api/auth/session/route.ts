import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Session API Route
 * Handles session validation and refresh
 */

/**
 * GET - Get current session information
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { session: null, user: null },
        { status: 200 }
      );
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { 
          session, 
          user: null,
          error: 'Failed to fetch user profile'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      session,
      user: profile
    });
    
  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Refresh session
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Parse request body
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Refresh session
    const { data, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (refreshError) {
      console.error('Session refresh error:', refreshError);
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No session after refresh' },
        { status: 401 }
      );
    }

    // Get updated user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile after refresh:', profileError);
      return NextResponse.json(
        { 
          session: data.session,
          user: null,
          error: 'Failed to fetch user profile'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      session: data.session,
      user: profile
    });
    
  } catch (error) {
    console.error('Session POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Invalidate session (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Sign out user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Session DELETE error:', error);
      return NextResponse.json(
        { error: 'Failed to invalidate session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Session invalidated successfully' });
    
  } catch (error) {
    console.error('Session DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}