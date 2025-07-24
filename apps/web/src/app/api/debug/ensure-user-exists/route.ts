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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const userEmail = 'dadecresce@gmail.com';
    
    // Generate the correct deterministic UUID
    const normalizedEmail = userEmail.toLowerCase().trim();
    const correctUuid = uuidv5(normalizedEmail, WIKIGAIALAB_NAMESPACE);
    
    console.log('🔍 ENSURE USER: Starting user check/creation', {
      email: userEmail,
      normalizedEmail,
      correctUuid,
      namespace: WIKIGAIALAB_NAMESPACE
    });

    // Check if user exists with correct UUID
    const { data: correctUser, error: correctUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', correctUuid)
      .single();

    if (correctUser) {
      console.log('✅ ENSURE USER: User already exists with correct UUID');
      return NextResponse.json({
        success: true,
        message: 'User already exists with correct UUID',
        user: {
          id: correctUser.id,
          email: correctUser.email,
          name: correctUser.name
        }
      });
    }

    // Check if user exists with different UUID
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (existingUser) {
      console.log('🔄 ENSURE USER: User exists with wrong UUID, migrating', {
        oldId: existingUser.id,
        newId: correctUuid
      });

      // Create user with correct UUID
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .upsert({
          id: correctUuid,
          email: existingUser.email,
          name: existingUser.name,
          image: existingUser.image,
          role: existingUser.role || 'user',
          is_admin: existingUser.is_admin || false,
          created_at: existingUser.created_at,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('*')
        .single();

      if (createError) {
        throw new Error(`Failed to create user with correct UUID: ${createError.message}`);
      }

      // Delete old user record
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', existingUser.id);

      if (deleteError) {
        console.warn('⚠️ ENSURE USER: Failed to delete old user record:', deleteError);
        // Don't fail the request if we can't delete the old record
      }

      console.log('✅ ENSURE USER: User migrated successfully');
      return NextResponse.json({
        success: true,
        message: 'User migrated to correct UUID',
        migration: {
          oldId: existingUser.id,
          newId: correctUuid,
          email: userEmail
        },
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      });
    }

    // User doesn't exist at all, create new
    console.log('🆕 ENSURE USER: Creating new user');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: correctUuid,
        email: userEmail,
        name: 'Davide Crescentini',
        image: null,
        role: 'user',
        is_admin: false,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (createError) {
      throw new Error(`Failed to create new user: ${createError.message}`);
    }

    console.log('✅ ENSURE USER: New user created successfully');
    return NextResponse.json({
      success: true,
      message: 'New user created',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });

  } catch (error) {
    console.error('❌ ENSURE USER: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to ensure user exists',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}