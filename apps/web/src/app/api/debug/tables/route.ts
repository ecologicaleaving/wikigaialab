import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Test access to different tables
    console.log('🔍 Testing table access...');
    
    const tests = {
      categories: null,
      problems: null,
      users: null,
      votes: null
    };
    
    // Test categories
    try {
      const { data, error } = await supabase.from('categories').select('count').limit(1);
      tests.categories = { success: !error, error: error?.message, hasData: !!data };
    } catch (err) {
      tests.categories = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
    
    // Test problems
    try {
      const { data, error } = await supabase.from('problems').select('count').limit(1);
      tests.problems = { success: !error, error: error?.message, hasData: !!data };
    } catch (err) {
      tests.problems = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
    
    // Test users
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      tests.users = { success: !error, error: error?.message, hasData: !!data };
    } catch (err) {
      tests.users = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
    
    // Test votes
    try {
      const { data, error } = await supabase.from('votes').select('count').limit(1);
      tests.votes = { success: !error, error: error?.message, hasData: !!data };
    } catch (err) {
      tests.votes = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
    
    return NextResponse.json({
      success: true,
      tableTests: tests,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}