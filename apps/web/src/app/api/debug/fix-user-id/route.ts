import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';
import type { Database } from '@wikigaialab/database';

const WIKIGAIALAB_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

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
    const supabase = getSupabaseClient();
    
    // Get the existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'dadecresce@gmail.com')
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: fetchError?.message
      }, { status: 404 });
    }

    // Generate the deterministic UUID
    const normalizedEmail = existingUser.email.toLowerCase().trim();
    const correctUuid = uuidv5(normalizedEmail, WIKIGAIALAB_NAMESPACE);

    const result = {
      email: existingUser.email,
      currentId: existingUser.id,
      correctId: correctUuid,
      needsUpdate: existingUser.id !== correctUuid,
      updated: false
    };

    // If IDs don't match, update the user
    if (existingUser.id !== correctUuid) {
      // First, create the user with the correct ID
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: correctUuid,
          email: existingUser.email,
          name: existingUser.name,
          image: existingUser.image,
          role: existingUser.role,
          is_admin: existingUser.is_admin,
          created_at: existingUser.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create user with correct ID',
          details: createError.message,
          result
        }, { status: 500 });
      }

      // Then delete the old user record
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', existingUser.id);

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to delete old user record',
          details: deleteError.message,
          result
        }, { status: 500 });
      }

      result.updated = true;
    }

    return NextResponse.json({
      success: true,
      message: result.needsUpdate ? 'User ID updated successfully' : 'User ID already correct',
      result
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}