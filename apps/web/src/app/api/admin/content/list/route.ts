import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'overview';
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query based on filters
    let query = supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        status,
        moderation_status,
        quality_score,
        is_featured,
        created_at,
        proposer:users!proposer_id(id, name),
        category:categories!category_id(id, name)
      `);

    // Apply filters
    switch (filter) {
      case 'pending':
        query = query.eq('moderation_status', 'pending');
        break;
      case 'flagged':
        // Get problems with active flags
        const { data: flaggedProblems } = await supabase
          .from('content_flags')
          .select('problem_id')
          .eq('status', 'pending');
        
        if (flaggedProblems && flaggedProblems.length > 0) {
          const flaggedIds = flaggedProblems.map(f => f.problem_id);
          query = query.in('id', flaggedIds);
        } else {
          // No flagged content, return empty array
          return NextResponse.json({ success: true, data: [] });
        }
        break;
      case 'featured':
        query = query.eq('is_featured', true);
        break;
      // 'all' case needs no additional filter
    }

    // Apply tab-specific filters
    switch (tab) {
      case 'moderation':
        query = query.eq('moderation_status', 'pending');
        break;
      case 'featured':
        query = query.eq('is_featured', true);
        break;
      // Other tabs use the filter parameter
    }

    // Execute query with pagination
    const { data: problems, error: problemsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (problemsError) {
      throw problemsError;
    }

    // Enrich problems with flag counts
    const problemIds = problems?.map(p => p.id) || [];
    
    let flagCounts: { [key: string]: number } = {};
    if (problemIds.length > 0) {
      const { data: flags } = await supabase
        .from('content_flags')
        .select('problem_id')
        .in('problem_id', problemIds)
        .eq('status', 'pending');

      if (flags) {
        flagCounts = flags.reduce((acc, flag) => {
          acc[flag.problem_id] = (acc[flag.problem_id] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
      }
    }

    // Add flag counts to problems
    const enrichedProblems = problems?.map(problem => ({
      ...problem,
      flag_count: flagCounts[problem.id] || 0
    })) || [];

    return NextResponse.json({ success: true, data: enrichedProblems });

  } catch (error) {
    console.error('Error fetching content list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}