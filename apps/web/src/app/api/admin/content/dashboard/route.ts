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

    // Get content statistics
    const [
      { count: totalProblems },
      { count: pendingModeration },
      { count: featuredProblems },
      { count: totalCategories },
      { count: totalCollections },
      { count: recentActivity }
    ] = await Promise.all([
      // Total problems
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true }),
      
      // Pending moderation
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('moderation_status', 'pending'),
      
      // Featured problems
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true),
      
      // Total categories
      supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Total collections
      supabase
        .from('content_collections')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Recent activity (problems created in last 7 days)
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Get category distribution
    const { data: categoryStats } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        problems_count,
        icon_name,
        color_hex
      `)
      .eq('is_active', true)
      .order('problems_count', { ascending: false });

    // Get recent problems for activity feed
    const { data: recentProblems } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        status,
        moderation_status,
        created_at,
        proposer:users!proposer_id(id, name),
        category:categories!category_id(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get moderation queue summary
    const { data: moderationQueue } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        created_at,
        proposer:users!proposer_id(id, name, email),
        category:categories!category_id(id, name)
      `)
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    // Calculate engagement metrics
    const { data: voteStats } = await supabase
      .from('problems')
      .select('vote_count');

    const totalVotes = voteStats?.reduce((sum, problem) => sum + (problem.vote_count || 0), 0) || 0;
    const averageVotes = totalProblems ? Math.round((totalVotes / totalProblems) * 100) / 100 : 0;

    const dashboard = {
      stats: {
        totalProblems: totalProblems || 0,
        pendingModeration: pendingModeration || 0,
        featuredProblems: featuredProblems || 0,
        totalCategories: totalCategories || 0,
        totalCollections: totalCollections || 0,
        recentActivity: recentActivity || 0,
        totalVotes,
        averageVotes
      },
      categoryDistribution: categoryStats || [],
      recentActivity: recentProblems || [],
      moderationQueue: moderationQueue || [],
      trends: {
        problemsGrowth: '+12%', // TODO: Calculate from historical data
        votesGrowth: '+8%',
        engagementGrowth: '+15%'
      }
    };

    return NextResponse.json({ success: true, data: dashboard });

  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}