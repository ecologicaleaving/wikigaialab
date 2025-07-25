import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import type { Database } from '@wikigaialab/database';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    
    // Get the user's email for logging
    const userEmail = session.user.email;
    console.log(`Granting admin privileges to user: ${userEmail} (${session.user.id})`);

    // First, ensure the user exists in the database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, name, is_admin')
      .eq('id', session.user.id)
      .single();

    let data, error;

    if (!existingUser) {
      console.log('User not found in database - user should be auto-created by session callback');
      return NextResponse.json({
        success: false,
        error: 'User not found in database. Please sign out and sign back in to ensure user is created.',
        details: 'The dual-identity architecture requires users to be created via session callback'
      }, { status: 400 });
    } else {
      console.log('User found in database, updating admin status');
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          is_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select('id, email, name, is_admin')
        .single();

      data = updatedUser;
      error = updateError;
    }

    if (error) {
      console.error('Error granting admin privileges:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to grant admin privileges',
        details: error.message
      }, { status: 500 });
    }

    console.log(`Successfully granted admin privileges to: ${userEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Admin privileges granted successfully',
      user: data,
      note: 'Please refresh the page or log out and log back in for changes to take effect'
    });

  } catch (error) {
    console.error('Grant admin error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// For security, we'll also allow checking current admin status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    
    // Get current user info from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, is_admin')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to check admin status'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: user,
      isAdmin: user?.is_admin || false
    });

  } catch (error) {
    console.error('Check admin status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}