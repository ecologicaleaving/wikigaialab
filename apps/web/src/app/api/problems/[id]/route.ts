import { NextResponse } from "next/server";
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

interface RouteContext {
  params: { id: string };
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Problem ID is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    
    console.log('🔍 Fetching problem with ID:', id);
    
    // First try simple query without JOINs
    const { data: problem, error } = await supabase
      .from('problems')
      .select('*')
      .eq('id', id)
      .single();

    console.log('🔍 Problem query result:', { problem: !!problem, error });
    
    if (error) {
      console.error('Problem fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Problem not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: problem
    });

  } catch (error) {
    console.error('Problem API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}
