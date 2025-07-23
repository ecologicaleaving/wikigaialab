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
    
    console.log('Syncing user:', {
      sessionId: session.user.id,
      email: session.user.email
    });

    // Check if user exists by email (old record)
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    // Check if user exists by current session ID
    const { data: existingUserById } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    let result;

    if (existingUserById) {
      // User already exists with correct ID
      result = { action: 'already_synced', user: existingUserById };
    } else if (existingUserByEmail) {
      // User exists with old ID, update to new stable ID
      console.log('Updating user ID from', existingUserByEmail.id, 'to', session.user.id);
      
      // First, update foreign key references
      await supabase
        .from('problems')
        .update({ proposer_id: session.user.id })
        .eq('proposer_id', existingUserByEmail.id);

      await supabase
        .from('votes')
        .update({ user_id: session.user.id })
        .eq('user_id', existingUserByEmail.id);

      // Then update the user record
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          id: session.user.id,
          name: session.user.name || existingUserByEmail.name,
          updated_at: new Date().toISOString()
        })
        .eq('email', session.user.email)
        .select('*')
        .single();

      if (updateError) throw updateError;
      result = { action: 'id_updated', user: updatedUser };
    } else {
      // Create new user with stable ID
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.name || null,
          auth_provider: 'google',
          is_admin: false, // Default to false, can be granted separately
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (createError) throw createError;
      result = { action: 'created', user: newUser };
    }

    return NextResponse.json({
      success: true,
      message: 'User sync completed',
      ...result
    });

  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}