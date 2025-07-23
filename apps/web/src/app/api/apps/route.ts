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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const accessModel = url.searchParams.get('accessModel');
    const featured = url.searchParams.get('featured') === 'true';
    const search = url.searchParams.get('search');

    const supabase = getSupabaseClient();
    
    // Build query
    let query = supabase
      .from('apps')
      .select('*, problems:problem_id(id, title)')
      .eq('is_published', true);

    // Apply filters
    if (accessModel) {
      query = query.eq('access_model', accessModel);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    const { data: apps, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Apps fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch apps'
      }, { status: 500 });
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      apps: apps || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Apps API error:', error);
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
