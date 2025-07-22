import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import type { Database } from '@wikigaialab/database';
import type { ProblemInsert } from '@wikigaialab/database';

// Initialize Supabase client
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    const supabase = getSupabaseClient();
    
    // Build query
    let query = supabase
      .from('problems')
      .select(`
        *,
        proposer:users!proposer_id(id, name, email),
        category:categories!category_id(id, name, color, icon),
        vote_count
      `)
      .eq('status', 'published'); // Only show published problems

    // Apply filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort as any, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: problems, error, count } = await query;

    if (error) {
      console.error('Error fetching problems:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch problems'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        problems: problems || [],
        total: count || 0,
        pagination: {
          page,
          limit,
          hasMore: (count || 0) > page * limit
        }
      }
    });

  } catch (error) {
    console.error('Error in problems GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch problems'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Problems POST endpoint called');
    
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({
        success: false,
        error: 'Database configuration error'
      }, { status: 500 });
    }
    
    console.log('Environment variables OK, checking auth...');
    const session = await auth();
    
    if (!session?.user) {
      console.log('No authenticated user');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log('User authenticated:', session.user.id);

    const body = await request.json();
    const { title, description, category_id } = body;
    console.log('Request body:', { title: title?.length, description: description?.length, category_id });

    // Validate required fields
    if (!title || !description || !category_id) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Title, description, and category are required'
      }, { status: 400 });
    }

    console.log('Validation passed, creating Supabase client...');
    const supabase = getSupabaseClient();

    // Verify category exists
    console.log('Verifying category exists:', category_id);
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      console.error('Category verification failed:', categoryError);
      return NextResponse.json({
        success: false,
        error: 'Invalid category selected'
      }, { status: 400 });
    }

    console.log('Category verified:', category.name);

    // Ensure user exists in database (upsert)
    console.log('Ensuring user exists in database...');
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: session.user.id!,
        email: session.user.email!,
        name: session.user.name || 'Unknown User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (userError) {
      console.error('Error ensuring user exists:', userError);
      return NextResponse.json({
        success: false,
        error: 'User synchronization failed: ' + userError.message
      }, { status: 500 });
    }

    console.log('User synchronized successfully');

    // Create the problem
    console.log('Creating problem data...');
    const problemData: ProblemInsert = {
      title: title.trim(),
      description: description.trim(),
      category_id,
      proposer_id: session.user.id!,
      status: 'published',
      vote_count: 1, // Auto-vote from creator
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting problem into database...');
    const { data: problem, error: insertError } = await supabase
      .from('problems')
      .insert(problemData)
      .select(`
        *,
        proposer:users!proposer_id(id, name, email),
        category:categories!category_id(id, name, color, icon)
      `)
      .single();

    if (insertError) {
      console.error('Error creating problem:', insertError);
      console.error('Problem data that failed:', problemData);
      return NextResponse.json({
        success: false,
        error: 'Failed to create problem: ' + insertError.message
      }, { status: 500 });
    }

    console.log('Problem created successfully:', problem.id);

    // Create the initial vote from the creator
    console.log('Creating initial vote...');
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        problem_id: problem.id,
        user_id: session.user.id!,
        created_at: new Date().toISOString()
      });

    if (voteError) {
      console.error('Error creating initial vote:', voteError);
      // Don't fail the request, just log the error
    } else {
      console.log('Initial vote created successfully');
    }

    console.log('Problem creation completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Problema creato con successo!',
      id: problem.id,
      data: problem
    });

  } catch (error) {
    console.error('Unexpected error in problems POST:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      success: false,
      error: 'Failed to create problem: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}