import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user and verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const status = searchParams.get('status') || 'pending';
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build moderation queue query based on our current schema
    let query = supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        status,
        vote_count,
        created_at,
        updated_at,
        proposer_id,
        category_id,
        users!problems_proposer_id_fkey(id, name, email, total_votes_cast, total_problems_proposed),
        categories!problems_category_id_fkey(id, name)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters based on our schema
    if (status && status !== 'all') {
      // Use the status field from our schema
      query = query.eq('status', status);
    }
    
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: problems, error: problemsError, count } = await query;

    if (problemsError) {
      console.error('Error fetching moderation queue:', problemsError);
      return NextResponse.json(
        { error: 'Failed to fetch moderation queue' },
        { status: 500 }
      );
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('problems')
      .select('moderation_status')
      .not('moderation_status', 'is', null);

    const statusCounts = stats?.reduce((acc, problem) => {
      const status = problem.moderation_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Transform the data to match frontend expectations
    const transformedProblems = problems?.map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      status: problem.status,
      vote_count: problem.vote_count,
      created_at: problem.created_at,
      updated_at: problem.updated_at,
      proposer: {
        id: problem.users?.id || problem.proposer_id,
        name: problem.users?.name || 'Unknown',
        email: problem.users?.email || '',
        total_votes_cast: problem.users?.total_votes_cast || 0,
        total_problems_proposed: problem.users?.total_problems_proposed || 0
      },
      category: {
        id: problem.categories?.id || problem.category_id,
        name: problem.categories?.name || 'Unknown'
      }
    })) || [];

    return NextResponse.json({
      problems: transformedProblems,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Error in moderation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk moderation action
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user and verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    const body = await request.json();
    const { problemIds, action, notes } = body;

    if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
      return NextResponse.json(
        { error: 'Problem IDs are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'needs_changes'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Map action to moderation status
    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      needs_changes: 'needs_changes'
    };

    const moderationStatus = statusMap[action as keyof typeof statusMap];

    // Update problems
    const { error: updateError } = await supabase
      .from('problems')
      .update({
        moderation_status: moderationStatus,
        moderation_notes: notes || null,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', problemIds);

    if (updateError) {
      console.error('Error updating problems:', updateError);
      return NextResponse.json(
        { error: 'Failed to update problems' },
        { status: 500 }
      );
    }

    // Log admin activity
    const activityLogs = problemIds.map(problemId => ({
      admin_id: user.id,
      action: 'moderate',
      resource_type: 'problem',
      resource_id: problemId,
      details: {
        moderation_action: action,
        moderation_status: moderationStatus,
        notes: notes || null
      },
      created_at: new Date().toISOString()
    }));

    // Insert activity logs (ignore errors as this is non-critical)
    try {
      await supabase
        .from('admin_activity_log')
        .insert(activityLogs);
    } catch (logError) {
      console.warn('Failed to log admin activity:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed ${problemIds.length} problem(s)`,
      data: {
        updatedCount: problemIds.length,
        action: moderationStatus
      }
    });

  } catch (error) {
    console.error('Error in bulk moderation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}