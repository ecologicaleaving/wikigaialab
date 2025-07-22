import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import type { Database } from '@wikigaialab/database';
import type { ProblemInsert } from '@wikigaialab/database';

// Initialize Supabase client
function getSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
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
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category_id } = body;

    // Validate required fields
    if (!title || !description || !category_id) {
      return NextResponse.json({
        success: false,
        error: 'Title, description, and category are required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category selected'
      }, { status: 400 });
    }

    // Create the problem
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
      return NextResponse.json({
        success: false,
        error: 'Failed to create problem'
      }, { status: 500 });
    }

    // Create the initial vote from the creator
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
    }

    return NextResponse.json({
      success: true,
      message: 'Problema creato con successo!',
      id: problem.id,
      data: problem
    });

  } catch (error) {
    console.error('Error creating problem:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create problem'
    }, { status: 500 });
  }
}