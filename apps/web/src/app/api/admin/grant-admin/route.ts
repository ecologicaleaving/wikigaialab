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

    // Update the user to be an admin
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_admin: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select('id, email, name, is_admin')
      .single();

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