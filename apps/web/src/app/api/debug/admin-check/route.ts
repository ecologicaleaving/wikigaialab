import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-nextauth';
import { createClient } from '@supabase/supabase-js';
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

export async function GET() {
  try {
    const session = await auth();
    
    console.log('Admin check - Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        adminAccess: false,
        reason: 'Not authenticated'
      });
    }

    const supabase = getSupabaseClient();
    
    // Check user in database by ID
    const { data: userById, error: idError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Check user in database by email (fallback)
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    // Determine admin status
    const isAdminById = userById?.is_admin || false;
    const isAdminByEmail = userByEmail?.is_admin || false;
    const hasAdminAccess = isAdminById || isAdminByEmail;

    return NextResponse.json({
      success: true,
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name
      },
      database: {
        userById: userById || null,
        userByEmail: userByEmail || null,
        idError: idError?.message || null,
        emailError: emailError?.message || null
      },
      adminStatus: {
        isAdminById,
        isAdminByEmail, 
        hasAdminAccess,
        shouldAllowAdmin: hasAdminAccess
      },
      debug: {
        message: hasAdminAccess 
          ? 'User should have admin access' 
          : 'User does not have admin access',
        nextStep: hasAdminAccess 
          ? 'Try refreshing browser or clearing session cache'
          : 'Need to grant admin privileges'
      }
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}