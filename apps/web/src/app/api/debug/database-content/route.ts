import { NextResponse } from 'next/server';
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
    const supabase = getSupabaseClient();
    
    // Get all problems
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        proposer_id,
        vote_count,
        status,
        created_at,
        categories:category_id(name),
        users:proposer_id(name, email)
      `)
      .limit(10);

    // Get all votes
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(10);

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .limit(10);

    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        problems: {
          count: problems?.length || 0,
          data: problems,
          error: problemsError?.message
        },
        votes: {
          count: votes?.length || 0,
          data: votes,
          error: votesError?.message
        },
        users: {
          count: users?.length || 0,
          data: users,
          error: usersError?.message
        },
        categories: {
          count: categories?.length || 0,
          data: categories,
          error: categoriesError?.message
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}