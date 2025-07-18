import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Test basic connection
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('*')
      .limit(5);
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    return NextResponse.json({
      database_connected: true,
      problems: {
        count: problems?.length || 0,
        error: problemsError?.message || null,
        data: problems?.slice(0, 2) || []
      },
      categories: {
        count: categories?.length || 0,
        error: categoriesError?.message || null,
        data: categories?.slice(0, 2) || []
      },
      users: {
        count: users?.length || 0,
        error: usersError?.message || null,
        data: users?.slice(0, 2) || []
      }
    });
  } catch (error) {
    return NextResponse.json({
      database_connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}