import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug cleanup-users endpoint called');
    
    const supabase = getSupabaseClient();
    
    // First, let's see what users exist with dadecresce email
    console.log('🔍 Finding users with dadecresce email...');
    const { data: usersToDelete, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'dadecresce@gmail.com');
    
    console.log('🔍 Users found:', { usersToDelete, findError });
    
    if (findError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to find users',
        details: findError.message
      }, { status: 500 });
    }
    
    // Delete all users with that email
    if (usersToDelete && usersToDelete.length > 0) {
      console.log(`🔍 Deleting ${usersToDelete.length} users with email dadecresce@gmail.com...`);
      
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('email', 'dadecresce@gmail.com');
      
      console.log('🔍 Delete result:', { deleteError });
      
      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to delete users',
          details: deleteError.message,
          usersFound: usersToDelete
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${usersToDelete.length} users with email dadecresce@gmail.com`,
        deletedUsers: usersToDelete.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        }))
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No users found with email dadecresce@gmail.com to delete'
      });
    }
    
  } catch (error) {
    console.error('❌ Debug cleanup-users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}